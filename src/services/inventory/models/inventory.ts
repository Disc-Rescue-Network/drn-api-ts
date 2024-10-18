import { BelongsTo, ForeignKey, DataType, Column, Table, Model, Length } from 'sequelize-typescript'

import { StoreLib } from '../../../store/lib'

import Disc from '../../disc/models/disc'


@Table
export default class Inventory extends Model {
    @Length({
        msg: 'length needs to be between 1 and 32',
        min: 1,
        max: 32
    })
    @Column
    course: string

    @Length({
        msg: 'length needs to be between 1 and 32',
        min: 1,
        max: 32
    })
    @Column
    name: string

    @Column({
        validate: StoreLib.isMobilePhone
    })
    phoneNumber: string

    @Length({
        msg: 'length needs to be between 1 and 10',
        min: 1,
        max: 10
    })
    @Column
    bin: string

    @Column({
        type: DataType.DATEONLY
    })
    dateFound: Date

    @Column({
        type: DataType.DATEONLY
    })
    dateTexted: Date

    @Column({
        type: DataType.DATEONLY
    })
    dateClaimed: Date

    @Column({
        type: DataType.ENUM(
            'UNCLAIMED',
            'PENDING_DROPOFF',
            'PENDING_STORE_PICKUP',
            'PENDING_COURSE_PICKUP',
            'PICKUP_OVERDUE',
            'FOR_SALE',
            'CLAIMED',
            'SOLD',
            'SOLD_OFFLINE',
            'SURRENDERED'
        )
    })
    status: string

    @Length({
        msg: 'length needs to be between 1 and 256',
        min: 1,
        max: 256
    })
    @Column({
        type: DataType.TEXT
    })
    comments: string

    @Length({
        msg: 'length needs to be between 1 and 32',
        min: 1,
        max: 32
    })
    @Column
    color: string

    /*
     * Its a virtual generated column. Will need to comment out for syncing with
     * database.
     */
    @Column({
        type: DataType.DATEONLY
    })
    claimBy: Date

    @Column
    dateSold: Date

    @Column({
        validate: StoreLib.isUrl
    })
    topImage: string

    @Column({
        validate: StoreLib.isUrl
    })
    bottomImage: string

    @Column({
        type: DataType.BOOLEAN
    })
    deleted: boolean

    @Length({
        msg: 'length needs to be between 1 and 16',
        min: 1,
        max: 16
    })
    @Column
    category: string

    @Length({
        msg: 'length needs to be between 1 and 16',
        min: 1,
        max: 16
    })
    @Column
    subcategory: string

    @Length({
        msg: 'length needs to be between 1 and 17',
        min: 1,
        max: 17
    })
    @Column
    orgCode: string

    @Column({
        type: DataType.DATEONLY
    })
    dateOfReminderText: Date

    @ForeignKey(() => Disc)
    @Column
    discId: number

    @BelongsTo(() => Disc, { onDelete: 'SET NULL' })
    disc: Disc
}


export type InventoryData = Omit<Inventory, keyof Model>
