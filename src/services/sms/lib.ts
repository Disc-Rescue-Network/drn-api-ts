import twilio from "twilio"
import { Op } from 'sequelize'

import PhoneOptIn from './models/phone-opt-in'

import config from '../../config'

import { InternalServerError } from '../../lib/error'

const twilioClient = twilio(config.twilioSID, config.twilioAuthToken)


export class SMSlib {
    getOptInStatus = async (phoneNumber: string) => {
        return PhoneOptIn.findOne({
            where: { phoneNumber: { [Op.like]: '%' + phoneNumber } },
            raw: true,
        })
    }

    sendSMS = async (body: string, to: string) => {
        try {
            const messageInstance = await twilioClient.messages.create({
                to,
                body,
                from: config.twilioSendFrom,
                messagingServiceSid: config.twilioMessagingSID,
            })

            console.log(`Message Instance: ${JSON.stringify(messageInstance, null, 4)}`)

            if (messageInstance.errorCode !== null) {
                throw new InternalServerError('Failed to send SMS')
            }
        } catch (e) {
            throw new InternalServerError('Failed to send SMS')
        }
    }
}


export default new SMSlib
