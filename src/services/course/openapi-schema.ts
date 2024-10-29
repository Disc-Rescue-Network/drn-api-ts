import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import Course from './models/course'


export default function () {
    const schemaManager = new SchemaManager
    const strategy = new OpenApiStrategy

    const GetCourseSchema = schemaManager.generate(Course, strategy, {
        associations: false
    })

    return {
        GetCourseSchema,
    }
}
