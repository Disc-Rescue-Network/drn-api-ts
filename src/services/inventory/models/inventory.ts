import { HasMany, Min, BelongsTo, ForeignKey, DataType, Column, Table, Model, Length } from 'sequelize-typescript'

import { StoreLib } from '../../../store/lib'

import Disc from '../../disc/models/disc'
import Course from '../../course/models/course'
import Claim from './claim'

import { DISC_CONDITION, INVENTORY_STATUS } from '../constant'


@Table
export default class Inventory extends Model {
    @Length({
        msg: 'length needs to be between 1 and 32',
        min: 1,
        max: 32
    })
    @Column({
        allowNull: false
    })
    name: string

    @Column({
        validate: StoreLib.isMobilePhone
    })
    phoneNumber: string

    @Length({
        msg: 'length needs to be between 1 and 32',
        min: 1,
        max: 32
    })
    @Column
    bin: string

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
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
        type: DataType.ENUM(...Object.values(INVENTORY_STATUS)),
        allowNull: false,
        defaultValue: INVENTORY_STATUS.UNCLAIMED
    })
    status: string

    /*
     * Need to use SQL statement to create full text index
     */
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
     * database and need to use SQL statement to add as generated column.
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
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    deleted: boolean

    /* Weight in grams */
    @Min(1)
    @Column
    weight: number

    @Column({
        type: DataType.ENUM(...Object.values(DISC_CONDITION))
    })
    condition: string

    @ForeignKey(() => Course)
    @Column
    orgCode: string

    @BelongsTo(() => Course, { onDelete: 'SET NULL', foreignKey: 'orgCode', targetKey: 'orgCode'})
    course: Course

    @Column({
        type: DataType.DATEONLY
    })
    dateOfReminderText: Date

    @ForeignKey(() => Disc)
    @Column({
        allowNull: false
    })
    discId: number

    @BelongsTo(() => Disc, { onDelete: 'SET NULL' })
    disc: Disc

    @HasMany(() => Claim)
    claims: Claim[] | []
}


export type InventoryData = Omit<Inventory, keyof Model>
