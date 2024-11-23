import { Request, Response } from 'express'

import AppController from '../../lib/app-controller'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'

import courseService from './service'
import generate from './openapi-schema'


export class CourseController extends AppController {
    init () {
        const schemas = generate()

        const GetCourseSchema = schemas.GetCourseSchema

        this.basePath = '/course'

        courseService.init()

        this.router.get(
            '',
            oapi.validPath(oapiPathDef({
                parameters: schemas.GetCourseParameters,
                responseData: paginatedResponse(GetCourseSchema),
                summary: 'Get Courses'
            })),
            this.findAll
        )

        return this
    }

    findAll = AppController.asyncHandler(
        async (req: Request) => {
            return courseService.findAll(req.query.orgCode as string[])
        }
    )
}


export default new CourseController
