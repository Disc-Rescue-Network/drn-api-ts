import Sequelize from 'sequelize'

import Brand, { BrandData } from './models/brand'

import { Page, PageOptions } from '../../lib/pagination'
import { ConflictError } from '../../lib/error'


export class BrandService {
    init () {
        return this
    }

    createBrand = async (data: BrandData) => {
        try {
            return await Brand.create(data)
        } catch(err) {
            if (err.name === 'SequelizeUniqueConstraintError')
                throw new ConflictError('Brand exists')

            throw err
        }
    }

    findAll = async (
        pageOptions: PageOptions,
        q?: string
    ) => {
        const where: {} = {}
        const query = {
            where,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
            raw: true,
            nest: true
        }

        if (q)
            where['_'] = Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Brand.name')), 'LIKE', '%' + q.toLocaleLowerCase() + '%')

        const result = await Brand.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }
}


export default new BrandService
