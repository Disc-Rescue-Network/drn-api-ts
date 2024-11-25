import { HasOne, BelongsTo, ForeignKey, DataType, Column, Table, Model } from 'sequelize-typescript'

import { NOTIFICATION_TYPE, NOTIFICATION_STATUS } from '../constant'

import Course from '../../course/models/course'
import NotificationTicket from '../../ticket/models/notification-ticket'


@Table
export default class Notification extends Model {
    @Column({
        type: DataType.ENUM(...Object.values(NOTIFICATION_TYPE)),
        allowNull: false
    })
    type: string

    @Column
    objectId: number

    @Column({
        type: DataType.ENUM(...Object.values(NOTIFICATION_TYPE)),
    })
    objectType: string

    @Column
    message: string

    @Column({
        type: DataType.ENUM(...Object.values(NOTIFICATION_STATUS)),
        allowNull: false,
        defaultValue: NOTIFICATION_STATUS.UNREAD
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


export type NotificationData = Omit<Notification, keyof Model | 'course' | 'nt'>
