import { Request, Response } from 'express'

import { plainToClass } from 'class-transformer'

import AppController from '../../lib/app-controller'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'
import { PageOptions } from '../../lib/pagination'

import brandService from './service'
import generate from './openapi-schema'


export class BrandController extends AppController {
    init () {
        const schemas = generate()

        const GetBrandSchema = schemas.GetBrandSchema

        this.basePath = '/brand'

        brandService.init()

        this.router.get(
            '',
            oapi.validPath(oapiPathDef({
                responseData: paginatedResponse(GetBrandSchema),
                summary: 'Get Brands'
            })),
            this.findAll
        )

        return this
    }

    findAll = AppController.asyncHandler(
        async (req: Request) => {
            return brandService.findAll(
                plainToClass(PageOptions, req.query),
                req.query.q as string
            )
        }
    )
}


export default new BrandController
