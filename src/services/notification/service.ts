import { Page, PageOptions } from '../../lib/pagination'

import Notification from './models/notification'

import { NOTIFICATION_TYPE, NOTIFICATION_STATUS } from './constant'

import inventoryLib from '../../services/inventory/lib'

import { NotFound } from '../../lib/error'


const notifStatus = [...Object.values(NOTIFICATION_STATUS)] as const
type STATUS_UPDATE = typeof notifStatus[number]


export class NotificationService {
    init () {
        return this
    }

    findAll = async (
        pageOptions: PageOptions,
    ) => {
        const query = {
            offset: pageOptions.offset,
            limit: pageOptions.limit,
            raw: true,
            nest: true
        }

        const result = await Notification.findAndCountAll(query)

        {
            const claimNotifs = []
            for (const res of result.rows) {
                if (res.type === NOTIFICATION_TYPE.CLAIM)
                    claimNotifs.push(res)
            }

            const claimObjects = await inventoryLib.getClaims(claimNotifs.map(notif => { return notif.objectId }))
            for (const notif of claimNotifs) {
                for (const claim of claimObjects) {
                    if (notif.objectId === claim.id)
                        notif['claim'] = claim
                }
            }
        }

        return new Page(result.rows, result.count, pageOptions)
    }

    updateStatus = async (id: number, status: STATUS_UPDATE) => {
        const result = await Notification.update({ status }, { where: { id } })

        if (result[0])
            return 'Record updated'

         throw new NotFound('No such record to update')
    }
}


export default new NotificationService
