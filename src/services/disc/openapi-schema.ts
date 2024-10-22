import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import config from '../../config'

import Disc from './models/disc'


export default function () {
    const schemaManager = new SchemaManager
    const strategy = new OpenApiStrategy

    const CreateDiscSchema = schemaManager.generate(Disc, strategy, {
        exclude: config.autoAttributes,
        associations: false
    })

    const GetDiscSchema = schemaManager.generate(Disc, strategy, {
        associations: false
    })

    return {
        CreateDiscSchema,
        GetDiscSchema,
    }
}
