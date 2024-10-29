import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import config from '../../config'

import SMSLogs from './models/sms-logs'
import PhoneOptIn from './models/phone-opt-in'


export default function () {
    const schemaManager = new SchemaManager
    const strategy = new OpenApiStrategy

    const CreateSMSLogSchema = schemaManager.generate(SMSLogs, strategy, {
        exclude: ['sentAt', ...config.autoAttributes],
        associations: false
    })

    const UpdatePhoneOptInSchema = schemaManager.generate(PhoneOptIn, strategy, {
        exclude: config.autoAttributes,
        associations: false
    })

    const GetPhoneOptInSchema = schemaManager.generate(PhoneOptIn, strategy, {
        associations: false
    })

    const TwilioSMSSchema = {
        type: 'object',
        properties: {
            From: {
                type: 'string',
                example: '7099554266'
            },
            Body: {
                type: 'string',
                example: 'Say Hi'
            }
        }
    }

    return {
        CreateSMSLogSchema,
        UpdatePhoneOptInSchema,
        GetPhoneOptInSchema,
        TwilioSMSSchema,
    }
}
