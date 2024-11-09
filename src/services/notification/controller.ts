import { Request, Response } from 'express'

import { plainToClass } from 'class-transformer'

import AppController from '../../lib/app-controller'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'
import { PageOptions } from '../../lib/pagination'

import notificationService from './service'
import generate from './openapi-schema'


export class NotificationController extends AppController {
    init () {
        const schemas = generate()

        this.basePath = '/notification'

        notificationService.init()

        this.router.get(
            '',
            oapi.validPath(oapiPathDef({
                responseData: paginatedResponse(schemas.GetNotificationSchema),
                summary: 'Get Notifications'
            })),
            this.findAll
        )

        this.router.patch(
            '/status',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.UpdateStatusSchema,
                summary: 'Update notification status'
            })),
            this.updateStatus
        )

        return this
    }

    findAll = AppController.asyncHandler(
        async (req: Request) => {
            return notificationService.findAll(
                plainToClass(PageOptions, req.query),
            )
        }
    )

    updateStatus = AppController.asyncHandler(
        async (req: Request) => {
            return notificationService.updateStatus(
                req.body.id,
                req.body.status
            )
        }
    )
}


export default new NotificationController
