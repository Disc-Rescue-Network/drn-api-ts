import { Request, Response } from 'express'

import AppController from '../../lib/app-controller'
import oapi, { oapiPathDef } from '../../lib/openapi'

import aiService from './service'
import generate from './openapi-schema'

import { requireLogin } from '../../web/middleware'


export class AIController extends AppController {
    init () {
        const schemas = generate()

        this.basePath = '/ai'

        aiService.init()

        this.router.post(
            '/image',
            requireLogin,
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.ExtractImageTextSchema,
                summary: 'Extract Image Text'
            })),
            this.extractImageText
        )

        return this
    }

    extractImageText = AppController.asyncHandler(
        async (req: Request) => {
            return aiService.extractImageText(req.body.image)
        }
    )
}


export default new AIController
