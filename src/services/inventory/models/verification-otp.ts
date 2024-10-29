import { BelongsTo, ForeignKey, Column, Table, Model, Length } from 'sequelize-typescript'

import Claim from './claim'


@Table({
    tableName: 'PCMVerificationOTPs'
})
export default class VerificationOTP extends Model {
    @ForeignKey(() => Claim)
    @Column({
        allowNull: false,
    })
    claimId: number

    @BelongsTo(() => Claim, { onDelete: 'CASCADE' })
    claim: Claim

    @Length({
        msg: 'length needs to be 6',
        min: 6,
        max: 6
    })
    @Column({
        allowNull: false
    })
    otp: string

    @Column({
        allowNull: false,
        defaultValue: false
    })
    phoneNumberMatches: boolean
}


export type VerificationOTPData = Omit<VerificationOTP, keyof Model>
