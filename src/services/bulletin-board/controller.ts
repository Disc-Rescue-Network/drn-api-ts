import { Request, Response } from 'express'

import { plainToClass } from 'class-transformer'

import AppController from '../../lib/app-controller'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'
import { PageOptions } from '../../lib/pagination'

import bulletinService from './service'
import generate from './openapi-schema'

import { requireLogin } from '../../web/middleware'


export class BulletinController extends AppController {
    init () {
        const schemas = generate()

        this.basePath = '/board'

        bulletinService.init()

        this.router.post(
            '',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.CreateBoardSchema,
                summary: 'Create Board'
            })),
            requireLogin,
            this.createBoard
        )

        this.router.get(
            '',
            oapi.validPath(oapiPathDef({
                responseData: paginatedResponse(schemas.GetBoardSchema),
                summary: 'Get Boards'
            })),
            requireLogin,
            this.findAll
        )

        this.router.patch(
            '/:id',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.UpdateBoardSchema,
                summary: 'Update Board'
            })),
            requireLogin,
            this.updateBoard
        )

        this.router.post(
            '/post',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.CreatePostSchema,
                summary: 'Create Post'
            })),
            requireLogin,
            this.createPost
        )

        this.router.get(
            '/post',
            oapi.validPath(oapiPathDef({
                responseData: paginatedResponse(schemas.GetPostSchema),
                summary: 'Get Posts'
            })),
            requireLogin,
            this.findAllPosts
        )

        this.router.patch(
            '/post/:id',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.UpdatePostSchema,
                summary: 'Update Post'
            })),
            requireLogin,
            this.updatePost
        )

        this.router.delete(
            '/post/:id',
            oapi.validPath(oapiPathDef({
                summary: 'Remove Post'
            })),
            requireLogin,
            this.removePost
        )

        return this
    }

    createBoard = AppController.asyncHandler(
        async (req: Request) => {
            return bulletinService.createBoard(
                req.auth.payload.org_code as string,
                req.body
            )
        }
    )

    findAll = AppController.asyncHandler(
        async (req: Request) => {
            return bulletinService.findAll(
                plainToClass(PageOptions, req.query),
                req.query.q as string
            )
        }
    )

    updateBoard = AppController.asyncHandler(
        async (req: Request) => {
            return bulletinService.updateBoard(parseInt(req.params.id), req.body)
        }
    )

    createPost = AppController.asyncHandler(
        async (req: Request) => {
            return bulletinService.createPost(req.body)
        }
    )

    findAllPosts = AppController.asyncHandler(
        async (req: Request) => {
            return bulletinService.findAllPosts(
                plainToClass(PageOptions, req.query),
                req.query.q as string,
                parseInt(req.query.boardId as string)
            )
        }
    )

    updatePost = AppController.asyncHandler(
        async (req: Request) => {
            return bulletinService.updatePost(parseInt(req.params.id), req.body)
        }
    )

    removePost = AppController.asyncHandler(
        async (req: Request) => {
            return bulletinService.removePost(parseInt(req.params.id))
        }
    )
}


export default new BulletinController
