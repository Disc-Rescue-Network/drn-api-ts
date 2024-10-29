import { Op } from 'sequelize'

import PhoneOptIn, { PhoneOptInData } from './models/phone-opt-in'
import SMSLogs, { SMSLogsData } from './models/sms-logs'

import { Page, PageOptions } from '../../lib/pagination'


export class SMSService {
    init () {
        return this
    }

    findAllPhoneOptIns = async (
        pageOptions: PageOptions,
        phoneNumber?: string,
        smsConsent?: boolean,
    ) => {
        const where: {} = {}

        const query = {
            where,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
            raw: true,
            nest: true,
        }

        if (phoneNumber)
            where['phoneNumber'] = { [Op.like]: `%${phoneNumber}%` }

        if (smsConsent !== undefined)
            where['smsConsent'] = smsConsent

        const result = await PhoneOptIn.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }

    updatePhoneOptIn = async (data: Partial<PhoneOptInData>) => {
        return PhoneOptIn.upsert(data)
    }

    insertSmsLog = async (data: SMSLogsData) => {
        return SMSLogs.create(data)
    }
}


export default new SMSService
