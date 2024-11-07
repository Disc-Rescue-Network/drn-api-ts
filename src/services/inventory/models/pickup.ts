import { DataType, BelongsTo, ForeignKey, Column, Table, Model } from 'sequelize-typescript'

import Claim from '../../inventory/models/claim'
import Course from '../../course/models/course'

import { PICKUP_PREFERENCE } from '../constant'


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
        type: DataType.JSON,
        allowNull: false,
        defaultValue: [PICKUP_PREFERENCE.WEEKEND_MORNING]
    })
    preference: string

    /* Admin sets this column when done with the verification */
    @Column({
        validate: {
            after48Hours(this: Pickup) {
                const co = new Date(this.scheduledOn).getTime()
                const now = Date.now()

                if (co <= now)
                    throw new Error('Confirmation date must be set after 48 hours')

                if (Math.abs(co - now) < 172800000)
                    throw new Error('Confirmation date must be after 48 hours')
            }
        }
    })
    scheduledOn: Date
}


export type PickupData = Omit<Pickup, keyof Model>
