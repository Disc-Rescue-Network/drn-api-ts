import { Op } from 'sequelize'

import Inventory, { InventoryData } from './models/inventory'
import Claim from './models/claim'
import Pickup from './models/pickup'
import Course from '../../services/course/models/course'
import Disc from '../../services/disc/models/disc'


export class InventoryLib {
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

    getClaims = async (id: number[], paranoid = true) => {
        return Claim.findAll({
            where: { id },
            include: [
                {
                    model: Inventory,
                    include: [Disc]
                },
                {
                    model: Pickup,
                    include: [Course]
                }
            ],
            paranoid
        })
    }
}


export default new InventoryLib
