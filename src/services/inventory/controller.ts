import { Request, Response } from 'express'

import { plainToClass } from 'class-transformer'

import AppController from '../../lib/app-controller'
import { Forbidden } from '../../lib/error'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'
import { PageOptions } from '../../lib/pagination'

import inventoryService from './service'
import generate from './openapi-schema'

import smslib from '../sms/lib'
import { sendSms } from '../sms/twilio.service'
import { formatClaimInventoryMessage, optInMessage } from '../sms/sms.model'

import { requireLogin, requireOrgAuth } from '../../web/middleware'


export class InventoryController extends AppController {
    public service = inventoryService

    init () {
        const schemas = generate()

        const CreateInventorySchema = schemas.CreateInventorySchema
        const UpdateInventorySchema = schemas.UpdateInventorySchema
        const GetInventorySchema = schemas.GetInventorySchema

        this.basePath = '/inventory'

        inventoryService.init()

        this.router.patch(
            '/:itemId',
            requireLogin,
            requireOrgAuth(async (req) => {
                const item = await this.service.findById(parseInt(req.params.itemId))
                if (item)
                    return item.orgCode
                return null
            }),
            oapi.validPath(oapiPathDef({
                requestBodySchema: UpdateInventorySchema,
                summary: 'Update Inventory'
            })),
            this.update
        )

        this.router.post(
            '',
            requireLogin,
            oapi.validPath(oapiPathDef({
                requestBodySchema: CreateInventorySchema,
                summary: 'Create Inventory'
            })),
            this.create
        )

        this.router.get(
            '',
            oapi.validPath(oapiPathDef({
                responseData: paginatedResponse(GetInventorySchema),
                summary: 'Get Inventory'
            })),
            this.findAll
        )

        this.router.get(
            '/claim',
            oapi.validPath(oapiPathDef({
                responseData: paginatedResponse(schemas.GetClaimSchema),
                summary: 'Get Claims'
            })),
            this.findAllClaims
        )

        this.router.post(
            '/claim',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.CreateClaimSchema,
                summary: 'Create Claim'
            })),
            this.claimItem
        )

        this.router.post(
            '/pcm/verify',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.VerifyPCMSchema,
                summary: 'Verify PCM'
            })),
            this.verifyPCM
        )

        this.router.put(
            '/claim/verify',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.VerifyClaimSchema,
                summary: 'Verify Claim'
            })),
            this.verifyClaim
        )

        this.router.patch(
            '/claim/pickup',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.ConfirmPickupSchema,
                summary: 'Confirm Schema'
            })),
            this.confirmPickup
        )

        this.router.patch(
            '/pickup/:id',
            oapi.validPath(oapiPathDef({
                summary: 'Complete Pickup'
            })),
            this.completePickup
        )

        return this
    }

    findAll = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.findAll(
                plainToClass(PageOptions, req.query),
                req.query.q as string,
                req.query.orgCode as string
            )
        }
    )

    findById = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.findById(parseInt(req.params.itemId))
        }
    )

    create = AppController.asyncHandler(
        async (req: Request) => {
            const orgCode = req.auth?.payload?.org_code
            if (!orgCode)
                throw new Forbidden('No org code', 'MISSING_ORG_CODE')

            const body = req.body

            const newItem = await inventoryService.create({
                ...body,
                orgCode: "org_6108516784ae"
            })

            if (body.textImmediately) {
                const unclaimedData = await inventoryService.getUnclaimedInventory(
                    body.phoneNumber
                )

                const optInStatus = await smslib.getOptInStatus(body.phoneNumber);

                let setDateTexted = false
                if (optInStatus === null) {
                    // request opt in
                    const smsResponse = await sendSms(
                        body.phoneNumber,
                        optInMessage
                    )
                    setDateTexted = !smsResponse === true
                } else if (optInStatus.smsConsent) {
                    // user is opted in, send text
                    const smsResponse = await sendSms(
                        body.phoneNumber,
                        formatClaimInventoryMessage(unclaimedData.length)
                    )
                    setDateTexted = !smsResponse === true
                } else {
                    // phone is opted out
                    setDateTexted = true
                }

                if (setDateTexted) {
                    await inventoryService.update(newItem.id, {
                        dateTexted: new Date(new Date().toISOString().split("T")[0]),
                    })
                }
            }

            return newItem.dataValues
        }
    )

    update = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.update(parseInt(req.params.itemId), req.body)
        }
    )

    verifyPCM = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.verifyPCM(req.body)
        }
    )

    findAllClaims = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.findAllClaims(
                plainToClass(PageOptions, req.query),
                req.query.q as string,
            )
        }
    )

    claimItem = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.claimItem(req.body)
        }
    )

    verifyClaim = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.verifyClaim(req.body)
        }
    )

    confirmPickup = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.confirmPickup(req.body)
        }
    )

    completePickup = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.completePickup(parseInt(req.params.id))
        }
    )
}


export default new InventoryController
