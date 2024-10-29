import { Request, Response, NextFunction } from 'express'
import openapi from '@wesleytodd/openapi'

import { FailureResponse } from '../lib/service-response'
import { ERR_CODES } from '../lib/error'

import { Order } from './pagination'


const searchParam = {
    in: 'query',
    name: 'q',
    schema: {
        default: '',
        type: 'string'
    }
}

const paginationParams = [
    {
        in: 'query',
        name: 'page',
        schema: {
            default: 1,
            type: 'integer'
        }
    },
    {
        in: 'query',
        name: 'pageSize',
        schema: {
            default: 10,
            type: 'integer'
        }
    },
    {
        in: 'query',
        name: 'order',
        schema: {
            default: Order.ASC,
            enum: [Order.ASC, Order.DESC],
            type: 'string'
        }
    }
]


export default openapi({
    /*
     * 3.0.3 vs 3.1.0
     *
     * Check https://stackoverflow.com/questions/50204588/how-to-define-uuid-property-in-json-schema-and-open-api-oas
     */
    openapi: '3.0.3',
    info: {
        title: '',
        description: '',
        version: '1.0.0'
    }
})

export function paginatedResponse(dataSchema: {}) {
    return {
        type: 'object',
        properties: {
            page: {
                type: 'integer'
            },
            pageSize: {
                type: 'integer'
            },
            items: {
                type: 'array',
                items: dataSchema
            }
        },
        required: ['page', 'pageSize', 'items']
    }
}

export function oapiPathDef(def: {
    multipart?: boolean,
    includeSearchParam?: boolean,
    includePaginationParams?: boolean,
    summary?: string,
    requestBodySchema?: {},
    examples?: {},
    responses?: {},
    responseData?: {}
}) {
    const parameters = []
    if (def.includePaginationParams)
        parameters.push(...paginationParams)
    if (def.includeSearchParam)
        parameters.push(searchParam)

    return structuredClone({
        summary: def.summary,
        parameters,
        requestBody: def.requestBodySchema ? {
            description: 'Request Body',
            required: true,
            content: def.multipart ? {
                'multipart/form-data': {
                    schema: def.requestBodySchema
                }
            } : {
                'application/json': {
                    schema: def.requestBodySchema
                }
            },
        } : undefined,
        responses: {
            200: {
                description: 'Response is OK',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                message: { type: 'string' },
                                data: def.responseData ?? { type: 'object' },
                            },
                            required: [
                                'success'
                            ]
                        }
                    }
                }
            },
            ...def.responses
        },
    })
}

export function errorHandler(err: Error, _: Request, res: Response, next: NextFunction) {
    if (!err['validationErrors'])
        return next(err)

    let status = 400

    res.status(status).json(
        new FailureResponse(
            err.message,
            ERR_CODES[status],
            { validationErrors: err['validationErrors'] }
        )
    )
}
