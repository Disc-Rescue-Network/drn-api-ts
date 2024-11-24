import { HasMany, Column, Table, Model, Length } from 'sequelize-typescript'

import DiscMold from '../../disc/models/disc'


@Table
export default class PlasticType extends Model {
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


export type PlasticTypeData = Omit<PlasticType, keyof Model>
