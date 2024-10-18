import Sequelize, { Op } from 'sequelize'
import { escape as sqlEscape } from 'mysql2'

import Inventory, { InventoryData } from './models/inventory'

import Disc from '../disc/models/disc'
import Brand from '../brand/models/brand'

import { Page, PageOptions } from '../../lib/pagination'


export class InventoryService {
    init () {
        return this
    }

    findAll = async (
        pageOptions: PageOptions,
        q: string,
        orgCode: string
    ) => {
        const where: any = { deleted: 0 }
        const include: any[] = [
            {
                model: Disc,
                include: Brand
            }
        ]

        const query = {
            where,
            include,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
            raw: true,
            nest: true,
        }

        if (q) {
            const qs = `%${q.toLocaleLowerCase()}%`

            query.where[Op.or] = [
                Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Inventory.name')), 'LIKE', qs),
                Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Inventory.name')), 'LIKE', qs),
                Sequelize.literal(`MATCH (comments) AGAINST (${sqlEscape(qs)})`),
                { 'phoneNumber': { [Op.like]: qs }},
            ]
        }

        if (orgCode) {
            query.where = {
                ...query.where,
                orgCode,
            }
        }

        const result = await Inventory.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }

    findById = async (id: number) => {
        return Inventory.findByPk(id)
    }

    create = async (data: InventoryData) => {
        return Inventory.create(data)
    }

    update = async (id: number, data: Partial<InventoryData>) => {
        return Inventory.update(data, { where: { id } })
    }

    getUnclaimedInventory = async (phoneNumber: string) => {
        return Inventory.findAll({
            where: {
                phoneNumber: { [Op.like]: '%' + phoneNumber },
                status: ['UNCLAIMED', 'NEW'],
                deleted: 0
            }
        })
    }
}


export default new InventoryService
