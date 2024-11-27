import { Request, Response } from 'express'

import { plainToClass } from 'class-transformer'

import AppController from '../../lib/app-controller'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'
import { PageOptions } from '../../lib/pagination'
import { NotFound } from '../../lib/error'

import ticketService from './service'
import generate from './openapi-schema'

import { requireLogin, requireOrgAuth } from '../../web/middleware'


export class TicketController extends AppController {
    init () {
        const schemas = generate()

        this.basePath = '/ticket'

        ticketService.init()

        this.router.post(
            '',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.CreateTicketSchema,
                summary: 'Create Tickets'
            })),
            requireLogin,
            this.create
        )

        this.router.get(
            '',
            oapi.validPath(oapiPathDef({
                parameters: schemas.GetTicketParameters,
                responseData: paginatedResponse(schemas.GetTicketSchema),
                summary: 'Get Tickets'
            })),
            requireLogin,
            this.findAll
        )

        this.router.patch(
            '',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.UpdateStatusSchema,
                summary: 'Update Ticket'
            })),
            requireLogin,
            requireOrgAuth(async (req) => {
                const ticket = await ticketService.findById(parseInt(req.body.id))
                if (ticket)
                    return ticket.orgCode

                throw new NotFound('No such ticket')
            }),
            this.updateStatus
        )

        return this
    }

    create = AppController.asyncHandler(
        async (req: Request) => {
            return ticketService.create({
                ...req.body,
                orgCode: req.auth.payload.org_code
            })
        }
    )

    findAll = AppController.asyncHandler(
        async (req: Request) => {
            return ticketService.findAll(
                plainToClass(PageOptions, req.query),
                req.auth.payload.org_code as string,
                parseInt(req.query.notificationId as string)
            )
        }
    )

    updateStatus = AppController.asyncHandler(
        async (req: Request) => {
            return ticketService.updateStatus(req.body)
        }
    )
}


export default new TicketController
