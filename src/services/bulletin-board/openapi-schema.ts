import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import config from '../../config'

import Board from './models/board'
import Post from './models/post'


export default function () {
    const schemaManager = new SchemaManager
    const strategy = new OpenApiStrategy

    const CreateBoardSchema = schemaManager.generate(Board, strategy, {
        exclude: [
            'orgCode',
            ...config.autoAttributes,
        ],
        associations: false
    })

    const GetBoardSchema = schemaManager.generate(Board, strategy, {
        associations: false
    })

    const UpdateBoardSchema = schemaManager.generate(Board, strategy, {
        exclude: [
            'orgCode',
            ...config.autoAttributes,
        ],
        associations: false
    })
    UpdateBoardSchema['additionalProperties'] = false

    const CreatePostSchema = schemaManager.generate(Post, strategy, {
        exclude: config.autoAttributes,
        associations: false
    })

    const GetPostSchema = schemaManager.generate(Post, strategy, {
        associations: false
    })

    const UpdatePostSchema = schemaManager.generate(Post, strategy, {
        exclude: [
            'boardId',
            ...config.autoAttributes,
        ],
        associations: false
    })
    UpdatePostSchema['additionalProperties'] = false

    return {
        CreateBoardSchema,
        GetBoardSchema,
        UpdateBoardSchema,

        CreatePostSchema,
        GetPostSchema,
        UpdatePostSchema,
    }
}
