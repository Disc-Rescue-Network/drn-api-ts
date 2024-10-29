/*
 * This table is not in use in the current codebase for now
 */

import { DataType, Column, Table, Model } from 'sequelize-typescript'

import { StoreLib } from '../../../store/lib'


@Table
export default class UserAccount extends Model {
    @Column
    firstName: string

    @Column
    lastName: string

    @Column({
        validate: StoreLib.isMobilePhone
    })
    phoneNumber: string

    @Column({
        validate: StoreLib.isEmail
    })
    email: string

    @Column({
        type: DataType.BOOLEAN
    })
    textingOptInStatus: boolean

    @Column({
        allowNull: false
    })
    accountType: string

    @Column({
        type: DataType.CHAR
    })
    homeCourse: string

    @Column
    udiscDisplayName: string

    @Column({
        allowNull: false,
        unique: true
    })
    kindeId: string
}


export type UserAccountData = Omit<UserAccount, keyof Model>
