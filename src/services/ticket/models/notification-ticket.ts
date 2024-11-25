import { BelongsTo, ForeignKey, Column, Table, Model } from 'sequelize-typescript'

import Notification from '../../notification/models/notification'
import Ticket from '../../ticket/models/ticket'


@Table
export default class NotificationTicket extends Model {
    @ForeignKey(() => Notification)
    @Column({
        allowNull: false
    })
    notificationId: number

    @BelongsTo(() => Notification, { onDelete: 'CASCADE' })
    notification: Notification

    @ForeignKey(() => Ticket)
    @Column({
        allowNull: false
    })
    ticketId: number

    @BelongsTo(() => Ticket, { onDelete: 'CASCADE' })
    ticket: Ticket
}


export type NotificationTicketData = Omit<NotificationTicket, keyof Model>
