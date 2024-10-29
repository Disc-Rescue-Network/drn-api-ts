import { PrimaryKey, DataType, Column, Table, Model } from 'sequelize-typescript'

import { StoreLib } from '../../../store/lib'


@Table
export default class PhoneOptIn extends Model {
    @PrimaryKey
    @Column({
        validate: StoreLib.isMobilePhone,
    })
    phoneNumber: string

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    smsConsent: boolean
}


export type PhoneOptInData = Omit<PhoneOptIn, keyof Model>
