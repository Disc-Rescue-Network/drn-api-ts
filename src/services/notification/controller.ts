import { Request, Response } from 'express'

import { plainToClass } from 'class-transformer'

import AppController from '../../lib/app-controller'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'
import { PageOptions } from '../../lib/pagination'

import notificationService from './service'
import generate from './openapi-schema'

import { requireLogin } from '../../web/middleware'


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
            requireLogin,
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
                req.auth.payload.org_code as string
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
