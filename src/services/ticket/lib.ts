import { Transaction } from 'sequelize'

import Ticket, { TicketData } from './models/ticket'
import NotificationTicket from './models/notification-ticket'


export class NotificationLib {
    create = async (
        data: Pick<TicketData, 'orgCode' | 'message'> & { notificationId?: number },
        transaction?: Transaction
    ) => {
        const ticket = await Ticket.create(data, { transaction })
        if (data.notificationId) {
            await NotificationTicket.create(
                {
                    notificationId: data.notificationId,
                    ticketId: ticket.id
                },
                { transaction }
            )
        }

        return ticket
    }
}


export default new NotificationLib
