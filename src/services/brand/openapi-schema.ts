import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import config from '../../config'

import Brand from './models/brand'


export default function () {
    const schemaManager = new SchemaManager
    const strategy = new OpenApiStrategy

    const CreateBrandSchema = schemaManager.generate(Brand, strategy, {
        exclude: config.autoAttributes,
        associations: false
    })

    const GetBrandSchema = schemaManager.generate(Brand, strategy, {
        associations: false
    })

    return {
        CreateBrandSchema,
        GetBrandSchema,
    }
}
