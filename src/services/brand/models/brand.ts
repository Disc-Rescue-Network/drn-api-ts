import { HasMany, Column, Table, Model, Length } from 'sequelize-typescript'

import DiscMold from '../../disc/models/disc'


@Table
export default class Brand extends Model {
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

    @HasMany(() => DiscMold)
    discs: DiscMold[]
}


export type BrandData = Omit<Brand, keyof Model>
