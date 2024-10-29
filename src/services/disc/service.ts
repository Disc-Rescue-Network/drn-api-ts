import Sequelize from 'sequelize'

import Brand from '../brand/models/brand'

import DiscMold, { DiscMoldData } from './models/disc'

import { Page, PageOptions } from '../../lib/pagination'
import { ConflictError } from '../../lib/error'


export class DiscService {
    init () {
        return this
    }

    createDisc = async (data: DiscMoldData) => {
        try {
            return await DiscMold.create(data)
        } catch(err) {
            if (err.name === 'SequelizeUniqueConstraintError')
                throw new ConflictError('Disc exists')

            throw err
        }
    }

    findAll = async (
        pageOptions: PageOptions,
        q?: string
    ) => {
        const where: {} = {}
        const include: any[] = [Brand]

        if (q)
            where['_'] = Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('DiscMold.name')), 'LIKE', '%' + q.toLocaleLowerCase() + '%')

        const query = {
            where,
            include,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
            raw: true,
            nest: true
        }

        const result = await DiscMold.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }
}


export default new DiscService
