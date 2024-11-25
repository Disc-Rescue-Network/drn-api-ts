import { HasOne, BelongsTo, ForeignKey, DataType, Column, Table, Model } from 'sequelize-typescript'

import { TICKET_STATUS } from '../constant'

import Course from '../../course/models/course'
import NotificationTicket from './notification-ticket'


@Table
export default class Ticket extends Model {
    @Column
    message?: string

    @Column({
        type: DataType.ENUM(...Object.values(TICKET_STATUS)),
        allowNull: false,
        defaultValue: TICKET_STATUS.UNRESOLVED
    })
    status: string

    @ForeignKey(() => Course)
    @Column({
        allowNull: false
    })
    orgCode: string

    @BelongsTo(() => Course, { onDelete: 'CASCADE', foreignKey: 'orgCode', targetKey: 'orgCode'})
    course: Course

    @HasOne(() => NotificationTicket)
    nt: NotificationTicket | null
}


export type TicketData = Omit<Ticket, keyof Model | 'course' | 'nt'>
