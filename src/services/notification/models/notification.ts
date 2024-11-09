import { DataType, Column, Table, Model } from 'sequelize-typescript'

import { NOTIFICATION_TYPE, NOTIFICATION_STATUS } from '../constant'


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
}


export type NotificationData = Omit<Notification, keyof Model>
