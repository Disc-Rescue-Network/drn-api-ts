import { BelongsTo, ForeignKey, Column, Table, Model, Length } from 'sequelize-typescript'

import Brand from '../../brand/models/brand'
import PlasticType from './plastic-type'


@Table({
    indexes: [
        {
            fields: ['name', 'brandId'],
            unique: true
        }
    ]
})
export default class DiscMold extends Model {
    @Length({
        msg: 'length needs to be between 1 and 32',
        min: 1,
        max: 32
    })
    @Column({
        allowNull: false,
    })
    name: string

    @Length({
        msg: 'length needs to be between 1 and 16',
        min: 1,
        max: 16
    })
    @Column
    plasticType: string

    @Length({
        msg: 'length needs to be between 1 and 16',
        min: 1,
        max: 16
    })
    @Column
    category: string

    @ForeignKey(() => Brand)
    @Column({
        allowNull: false
    })
    brandId: number

    @BelongsTo(() => Brand, { onDelete: 'CASCADE' })
    brand: Brand

    @ForeignKey(() => PlasticType)
    @Column
    plasticTypeId?: number

    @BelongsTo(() => PlasticType, { onDelete: 'SET NULL' })
    plasticTypeObj?: PlasticType
}


export type DiscMoldData = Omit<DiscMold, keyof Model>
