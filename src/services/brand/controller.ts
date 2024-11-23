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

        this.basePath = '/brand'

        brandService.init()

        this.router.post(
            '',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.CreateBrandSchema,
                summary: 'Create Brand'
            })),
            this.createBrand
        )

        this.router.get(
            '',
            oapi.validPath(oapiPathDef({
                includeSearchParam: true,
                responseData: paginatedResponse(schemas.GetBrandSchema),
                summary: 'Get Brands'
            })),
            this.findAll
        )

        return this
    }

    createBrand = AppController.asyncHandler(
        async (req: Request) => {
            return brandService.createBrand(req.body)
        }
    )

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
