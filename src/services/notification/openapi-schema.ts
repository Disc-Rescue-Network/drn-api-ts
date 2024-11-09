import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import Notification from './models/notification'
import { NOTIFICATION_STATUS } from './constant'


export default function () {
    const schemaManager = new SchemaManager
    const strategy = new OpenApiStrategy

    const GetNotificationSchema = schemaManager.generate(Notification, strategy, {
        associations: false
    })

    const UpdateStatusSchema = {
        type: 'object',
        properties: {
            id: {
                type: 'integer',
                minimum: 1
            },
            status: {
                type: 'string',
                enum: Object.values(NOTIFICATION_STATUS)
            }
        }
    }

    return {
        GetNotificationSchema,
        UpdateStatusSchema
    }
}
