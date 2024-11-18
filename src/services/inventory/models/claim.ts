import { HasOne, DataType, BelongsTo, ForeignKey, Column, Table, Model, Length } from 'sequelize-typescript'

import { StoreLib } from '../../../store/lib'

import Inventory from '../../inventory/models/inventory'
import Pickup, { PickupData } from '../../inventory/models/pickup'


/*
 * 1. How will we know if admin has contacted the claimer. Should we set some
 *    status for that ? Yes
 * 2. How to handle multiple claims for the same item ? Manually by admin
 */


@Table({
    validate: {
        validator(this: Claim) {
            if (this.email && this.phoneNumber)
                throw Error(`Only one preferred communication method is allowed`)

            if (!this.email && !this.phoneNumber)
                throw Error(`Email or phone number is needed as preferred communication`)
        }
    },
})
export default class Claim extends Model {
    @ForeignKey(() => Inventory)
    @Column({
        allowNull: false,
    })
    itemId: number

    @BelongsTo(() => Inventory, { onDelete: 'CASCADE' })
    item: Inventory

    @Length({
        msg: 'length needs to be between 1 and 256',
        min: 1,
        max: 256
    })
    @Column({
        type: DataType.TEXT
    })
    comments: string

    @Column({
        allowNull: false,
        defaultValue: false
    })
    pcmVerified: boolean

    @Column({
        allowNull: false,
        defaultValue: false
    })
    tofAccepted: boolean

    /*
     * Admin will manually mark it verified when PCM is email or phone number on
     * disk and phone number in PCM are different. Admin need to verify the
     * claim as well if user surrenders the disc. Claims which are verified when
     * surrendered are moved to store.
     */
    @Column({
        allowNull: false,
        defaultValue: false
    })
    verified: boolean

    @Column({
        allowNull: false,
        defaultValue: false
    })
    surrendered: boolean

    @Column({
        validate: StoreLib.isEmail
    })
    email: string

    @Column({
        validate: StoreLib.isMobilePhone
    })
    phoneNumber: string

    @HasOne(() => Pickup)
    pickup: Pickup
}


export type ClaimData = Omit<Claim, 'pickup' | keyof Model> & { pickup: PickupData }
