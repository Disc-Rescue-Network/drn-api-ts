import { BelongsTo, ForeignKey, HasMany, Column, Table, Model, Length } from 'sequelize-typescript'

import Course from '../../course/models/course'
import Post from './post'


@Table({
    tableName: 'BulletinBoards',
    indexes: [
        {
            fields: ['name', 'orgCode']
        }
    ]
})
export default class Board extends Model {
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

    @ForeignKey(() => Course)
    @Column({
        allowNull: false
    })
    orgCode: string

    @BelongsTo(() => Course, { onDelete: 'CASCADE', foreignKey: 'orgCode', targetKey: 'orgCode'})
    course: Course

    @HasMany(() => Post)
    posts: Post[]
}


export type BoardData = Omit<Board, keyof Model>
