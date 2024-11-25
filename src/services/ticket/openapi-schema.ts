import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import config from '../../config'

import Ticket from './models/ticket'
import { TICKET_STATUS } from './constant'


export default function () {
    const schemaManager = new SchemaManager
    const strategy = new OpenApiStrategy

    const CreateTicketSchema = schemaManager.generate(Ticket, strategy, {
        exclude: [
            'orgCode',
            'status',
            ...config.autoAttributes
        ],
        associations: false
    })

    const GetTicketSchema = schemaManager.generate(Ticket, strategy, {
        associations: false
    })

    const GetTicketParameters = [
        {
            in: 'query',
            name: 'notificationId',
            schema: {
                type: 'integer'
            },
            required: false
        }
    ]

    const UpdateStatusSchema = {
        type: 'object',
        properties: {
            id: {
                type: 'integer',
                minimum: 1
            },
            message: {
                type: 'string',
                minLength: 1
            },
            status: {
                type: 'string',
                enum: Object.values(TICKET_STATUS)
            }
        },
        required: ['id'],
        anyOf: [
            { required: ['message'] },
            { required: ['status'] },
        ]
    }

    return {
        CreateTicketSchema,
        GetTicketSchema,
        GetTicketParameters,
        UpdateStatusSchema
    }
}
