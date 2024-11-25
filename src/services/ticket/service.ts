import { Page, PageOptions } from '../../lib/pagination'

import Ticket, { TicketData } from './models/ticket'
import NotificationTicket from './models/notification-ticket'

import Notification from '../notification/models/notification'

import mysql from '../../store/mysql'

import { NotFound } from '../../lib/error'

import ticketLib from './lib'


export class TicketService {
    init () {
        return this
    }

    create = async (data: TicketData) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const ticket = await ticketLib.create(data, transaction)
            await transaction.commit()
            return ticket
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    findAll = async (
        pageOptions: PageOptions,
        orgCode: string,
        notificationId?: number
    ) => {
        const where: any = { orgCode }
        const include = [
        ]

        if (notificationId) {
            include.push({
                model: NotificationTicket,
                where: { notificationId },
                include: [Notification]
            })
        } else {
            include.push({
                model: NotificationTicket,
                include: [Notification]
            })
        }

        const query = {
            where,
            include,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
            raw: true,
            nest: true
        }

        const result = await Ticket.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }

    updateStatus = async (data: TicketData & { id: number }) => {
        const result = await Ticket.update(data, { where: { id: data.id } })
        if (result[0])
            return 'Record updated'

         throw new NotFound('No such record to update')
    }
}


export default new TicketService
