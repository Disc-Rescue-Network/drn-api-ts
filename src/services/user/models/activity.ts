import { BelongsTo, ForeignKey, DataType, Column, Table, Model } from 'sequelize-typescript'

import { ACTIVITY_TYPE, ACTIVITY_TARGET } from '../constant'

import Course from '../../course/models/course'


@Table
export default class Activity extends Model {
    @Column({
        type: DataType.ENUM(...Object.values(ACTIVITY_TYPE)),
        allowNull: false
    })
    type: string

    @Column
    objectId: number

    @Column({
        type: DataType.ENUM(...Object.values(ACTIVITY_TARGET)),
    })
    objectType?: string

    @Column
    message?: string

    @Column({
        type: DataType.JSON,
    })
    data?: object

    @Column
    user?: string

    @ForeignKey(() => Course)
    @Column({
        allowNull: false
    })
    orgCode?: string

    @BelongsTo(() => Course, { onDelete: 'CASCADE', foreignKey: 'orgCode', targetKey: 'orgCode'})
    course?: Course
}


export type ActivityData = Omit<Activity, keyof Model>
