import { BelongsTo, ForeignKey, DataType, Column, Table, Model, Length } from 'sequelize-typescript'

import { StoreLib } from '../../../store/lib'

import Inventory from '../../inventory/models/inventory'


@Table
export default class SMSLogs extends Model {
    @ForeignKey(() => Inventory)
    @Column({
        allowNull: false
    })
    itemId: number

    @BelongsTo(() => Inventory)
    item?: Inventory

    @Length({
        msg: 'length needs to be between 1 and 160',
        min: 1,
        max: 160
    })
    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    message: string

    @Column({
        allowNull: false,
        validate: StoreLib.isMobilePhone
    })
    recipientPhone: string

    @Column({
        allowNull: false
    })
    sentBy: string

    @Column({
        allowNull: false
    })
    sentAt: Date
}


export type SMSLogsData = Omit<SMSLogs, keyof Model>
