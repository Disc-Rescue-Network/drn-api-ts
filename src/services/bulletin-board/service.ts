import Sequelize from 'sequelize'
import { escape as sqlEscape } from 'mysql2'

import Board, { BoardData } from './models/board'
import Post, { PostData } from './models/post'

import { Page, PageOptions } from '../../lib/pagination'
import { ConflictError } from '../../lib/error'


export class BulletinService {
    init () {
        return this
    }

    createBoard = async (orgCode: string, data: BoardData) => {
        try {
            return await Board.create({ ...data, orgCode })
        } catch(err) {
            if (err.name === 'SequelizeUniqueConstraintError')
                throw new ConflictError('Board exists')

            throw err
        }
    }

    findAll = async (
        pageOptions: PageOptions,
        q?: string
    ) => {
        const where: {} = {}
        const include: {}[] = [
            {
                model: Post
            }
        ]
        const query = {
            where,
            include,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
            raw: true,
            nest: true
        }

        if (q)
            where['_'] = Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Board.name')), 'LIKE', '%' + q.toLocaleLowerCase() + '%')

        const result = await Board.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }

    updateBoard = async (id: number, data: BoardData) => {
        try {
            return await Board.update(data, { where: { id } })
        } catch(err) {
            if (err.name === 'SequelizeUniqueConstraintError')
                throw new ConflictError('Board exists')

            throw err
        }
    }

    createPost = async (data: PostData) => {
        return Post.create(data)
    }

    findAllPosts = async (
        pageOptions: PageOptions,
        q?: string,
        boardId?: number
    ) => {
        const where: {} = {}
        const query = {
            where,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
        }

        if (q) {
            /*
             * Substring matches with TEXT columns seems unavailable
             *
             * Check https://stackoverflow.com/a/18100730
             */
            const qs = `${q.toLowerCase()}*`
            where['_'] = Sequelize.literal(`MATCH (message) AGAINST (${sqlEscape(qs)} IN BOOLEAN MODE)`)
        }

        if (boardId) {
            where['boardId'] = boardId
        }

        const result = await Post.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }

    removePost = async (id: number) => {
        return Post.destroy({ where: { id } })
    }

    updatePost = async (id: number, data: PostData) => {
        return Post.update(data, { where: { id } })
    }
}


export default new BulletinService
