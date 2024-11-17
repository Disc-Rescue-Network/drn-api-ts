import twilio from 'twilio'
import { Op, Transaction } from 'sequelize'

import PhoneOptIn from './models/phone-opt-in'
import SMSLogs, { SMSLogsData } from './models/sms-logs'

import config from '../../config'

import { InternalServerError } from '../../lib/error'

const twilioClient = twilio(config.twilioSID, config.twilioAuthToken)


export class SMSlib {
    getOptInStatus = async (phoneNumber: string, transaction?: Transaction) => {
        return PhoneOptIn.findOne({
            where: { phoneNumber: { [Op.like]: '%' + phoneNumber } },
            raw: true,
            transaction
        })
    }

    sendSMS = async (to: string, body: string) => {
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

    sendVCard = async (
        to: string,
        body: string
    ) => {
        try {
            const messageInstance = await twilioClient.messages.create({
                to,
                body,
                from: config.twilioSendFrom,
                mediaUrl: [
                    config.twilio_vcf_url,
                ],
            })

            console.log(`Message Instance: ${JSON.stringify(messageInstance, null, 4)}`)

            if (messageInstance.errorCode !== null) {
                throw new InternalServerError('Failed to send vcard')
            }
        } catch (e) {
            throw new InternalServerError('Failed to send vcard')
        }
    }

    insertSmsLog = async (data: SMSLogsData, transaction?: Transaction) => {
        return SMSLogs.create(data, { transaction })
    }
}


export default new SMSlib
