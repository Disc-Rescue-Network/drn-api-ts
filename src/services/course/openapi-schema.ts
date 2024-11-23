import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import Course from './models/course'


export default function () {
    const schemaManager = new SchemaManager
    const strategy = new OpenApiStrategy

    const GetCourseSchema = schemaManager.generate(Course, strategy, {
        associations: false
    })

    const GetCourseParameters = [
        {
            in: 'query',
            name: 'orgCode',
            schema: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            required: false
        }
    ]

    return {
        GetCourseSchema,
        GetCourseParameters
    }
}
