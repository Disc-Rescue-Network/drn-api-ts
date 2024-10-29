import { Column, Table, Model, Length } from 'sequelize-typescript'

import { StoreLib } from '../../../store/lib'


@Table
export default class Course extends Model {
    @Length({
        msg: 'length needs to be between 1 and 17',
        min: 1,
        max: 17
    })
    @Column({
        allowNull: false,
        unique: true
    })
    orgCode: string

    @Length({
        msg: 'length needs to be between 1 and 32',
        min: 1,
        max: 32
    })
    @Column({
        allowNull: false,
        unique: true
    })
    name: string

    @Length({
        msg: 'length needs to be between 1 and 16',
        min: 1,
        max: 16
    })
    @Column
    state: string

    @Length({
        msg: 'length needs to be between 1 and 16',
        min: 1,
        max: 16
    })
    @Column
    city: string

    @Length({
        msg: 'length needs to be between 1 and 8',
        min: 1,
        max: 8
    })
    @Column
    shortCode: string

    @Column
    activeForLostAndFound: boolean

    @Column({
        validate: StoreLib.isUrl
    })
    @Column
    shortLink: string

    @Column({
        validate: StoreLib.isUrl
    })
    link: string

    @Column({
        validate: StoreLib.isUrl
    })
    udiscLeagueURL: string
}


export type CourseData = Omit<Course, keyof Model>
