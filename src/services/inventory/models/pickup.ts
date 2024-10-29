import { DataType, BelongsTo, ForeignKey, Column, Table, Model } from 'sequelize-typescript'

import Claim from '../../inventory/models/claim'
import Course from '../../course/models/course'

import { PICKUP_DAYS, PICKUP_TIMES } from '../constant'


@Table
export default class Pickup extends Model {
    @ForeignKey(() => Claim)
    @Column({
        allowNull: false,
    })
    claimId: number

    @BelongsTo(() => Claim, { onDelete: 'CASCADE' })
    claim: Claim

    @ForeignKey(() => Course)
    @Column
    courseId: number

    @BelongsTo(() => Course, { onDelete: 'SET NULL' })
    course: Course

    @Column({
        type: DataType.ENUM(...Object.values(PICKUP_DAYS)),
        allowNull: false,
        defaultValue: PICKUP_DAYS.WEEKEND
    })
    day: Date

    @Column({
        type: DataType.ENUM(...Object.values(PICKUP_TIMES)),
        allowNull: false,
        defaultValue: PICKUP_TIMES.AFTERNOON
    })
    time: string

    /*
     * After confirming the claim, admin marks the pickup as scheduled
     */
    @Column({
        allowNull: false,
        defaultValue: false
    })
    confirmed: boolean
}


export type PickupData = Omit<Pickup, keyof Model>
