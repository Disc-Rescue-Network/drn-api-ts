import { Request, Response } from 'express'
import twilio, { twiml } from 'twilio'

import { plainToClass } from 'class-transformer'

import AppController from '../../lib/app-controller'
import { Forbidden } from '../../lib/error'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'
import { PageOptions } from '../../lib/pagination'

import { SMSLogsData } from './models/sms-logs'

import smsService from './service'
import generate from './openapi-schema'
import lib from './lib'

import smslib from '../sms/lib'
import {
  OPT_IN_KEYWORDS,
  OPT_OUT_KEYWORDS,
  TICKET_KEYWORD,
  formatClaimInventoryMessage,
  optInMessage,
  ticketMessage,
  defaultMessage,
} from './message'

import inventoryLib from '../inventory/lib'

import config from '../../config'

import { requireLogin } from '../../web/middleware'

import { vcard } from '../../vcard'


export class SMSController extends AppController {
    init () {
        const schemas = generate()

        this.basePath = '/sms'

        smsService.init()

        this.router.get('/phone-opt-in/vcf', async (_, res) => {
            res.setHeader('Content-Type', 'text/vcard')
            res.send(vcard)
        })

        this.router.post(
            '/phone-opt-in/twilio',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.TwilioSMSSchema,
                summary: 'Send Twilio SMS'
            })),
            this.handleTwilioSms
        )

        this.router.post(
            '/keyword',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.TwilioSMSSchema,
                summary: 'Respond to SMS keyword'
            })),
            this.handleTwilioSms
        )

        this.router.put(
            '/phone-opt-in',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.UpdatePhoneOptInSchema,
                summary: 'Update Phone Opt In'
            })),
            this.updatePhoneOptIn
        )

        this.router.post(
            '',
            requireLogin,
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.SendSMSSchema,
                summary: 'Send SMS'
            })),
            this.postSMS
        )

        this.router.get(
            '/phone-opt-in',
            oapi.validPath(oapiPathDef({
                responseData: paginatedResponse(schemas.GetPhoneOptInSchema),
                summary: 'Get Phone Opt In'
            })),
            this.findAllPhoneOptIns
        )

        return this
    }

    findAllPhoneOptIns = AppController.asyncHandler(
        async (req: Request) => {
            return smsService.findAllPhoneOptIns(
                plainToClass(PageOptions, req.query),
                req.query.phoneNumber as string,
                parseInt(req.query.smsConsent as string),
            )
        }
    )

    updatePhoneOptIn = AppController.asyncHandler(
        async (req: Request) => {
            return smsService.updatePhoneOptIn(req.body)
        }
    )

    postSMS = AppController.asyncHandler(
        async (req: Request) => {
            const reqBody: Omit<SMSLogsData, 'sentAt'> & {
                initialText: boolean,
                sentAt: Date
            } = req.body

            if (reqBody.initialText) {
                const optInStatus = await lib.getOptInStatus(reqBody.recipientPhone)

                let setDateTexted = false

                if (optInStatus === null) {
                    // request opt in
                    await smslib.sendSMS(
                        reqBody.recipientPhone,
                        optInMessage
                    )

                    setDateTexted = true
                } else if (optInStatus.smsConsent) {
                    // Log the custom SMS
                    await lib.insertSmsLog({
                        ...reqBody,
                        sentAt: new Date(),
                    })

                    // user is opted in, send text
                    await smslib.sendSMS(
                        reqBody.recipientPhone,
                        reqBody.message
                    )

                    setDateTexted = true
                }

                if (setDateTexted) {
                    await inventoryLib.update(reqBody.itemId, {
                        dateTexted: new Date(new Date().toISOString().split("T")[0]),
                    })
                }
            } else {
                // Log the custom SMS
                await lib.insertSmsLog({
                    ...reqBody,
                    sentAt: new Date(),
                })

                await smslib.sendSMS(
                    reqBody.recipientPhone,
                    reqBody.message
                )
            }

            return 'SMS sent successfully'
        }
    )

    handleTwilioSms = async (req: Request, res: Response) => {
        if (process.env.NODE_ENV !== 'local') {
            const isTwilio = twilio.validateRequest(
                config.twilioAuthToken,
                req.headers['x-twilio-signature'] as string,
                config.twilioWebhookURL,
                req.body
            )

            if (!isTwilio)
                throw new Forbidden('Invalid twilio signature')
        }

        const phoneNumber = req.body.From
        const textMessage = req.body.Body.trim().toLowerCase()

        let responseMessage = defaultMessage

        const twilioResponse = new twiml.MessagingResponse()

        res.type('text/xml')

        if (textMessage === TICKET_KEYWORD) {
            return res.send(twilioResponse.message(ticketMessage).toString())
        } else if (OPT_OUT_KEYWORDS.includes(textMessage)) {
            await smsService.updatePhoneOptIn({
                phoneNumber,
                smsConsent: false,
            })

            return res.send(twilioResponse.message('Successfully opted out of SMS').toString())
        } else {
            const optInStatus = await lib.getOptInStatus(phoneNumber)
            if (OPT_IN_KEYWORDS.includes(textMessage)) {
                if (!optInStatus || (optInStatus && !optInStatus.smsConsent)) {
                    await smsService.updatePhoneOptIn({
                        phoneNumber,
                        smsConsent: true,
                    })

                    await smslib.sendVCard(
                        phoneNumber,
                        'DRN: Save our contact to make sure you get all the latest updates from Disc Rescue Network!'
                    )
                }

                const currentInventoryForUser = await inventoryLib.getUnclaimedInventory(phoneNumber)
                responseMessage = formatClaimInventoryMessage(currentInventoryForUser.length)
            } else {
                if (!optInStatus)
                    responseMessage = optInMessage
                else if (!optInStatus.smsConsent)
                    responseMessage = 'You have not opted for SMS'
            }
        }

        return res.send(twilioResponse.message(responseMessage).toString())
    }
}


export default new SMSController
