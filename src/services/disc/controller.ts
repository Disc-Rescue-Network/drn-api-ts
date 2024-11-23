import { Request, Response } from 'express'

import { plainToClass } from 'class-transformer'

import AppController from '../../lib/app-controller'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'
import { PageOptions } from '../../lib/pagination'

import discService from './service'
import generate from './openapi-schema'


export class DiscController extends AppController {
    init () {
        const schemas = generate()

        this.basePath = '/disc'

        discService.init()

        this.router.post(
            '',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.CreateDiscSchema,
                summary: 'Create Disc'
            })),
            this.createDisc
        )

        this.router.get(
            '',
            oapi.validPath(oapiPathDef({
                includeSearchParam: true,
                responseData: paginatedResponse(schemas.GetDiscSchema),
                summary: 'Get Discs'
            })),
            this.findAll
        )

        return this
    }

    createDisc = AppController.asyncHandler(
        async (req: Request) => {
            return discService.createDisc(req.body)
        }
    )

    findAll = AppController.asyncHandler(
        async (req: Request) => {
            return discService.findAll(
                plainToClass(PageOptions, req.query),
                req.query.q as string
            )
        }
    )
}


export default new DiscController
