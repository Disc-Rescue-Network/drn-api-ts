import { DataType, BelongsTo, ForeignKey, Column, Table, Model } from 'sequelize-typescript'

import Board from './board'


@Table({
    tableName: 'BulletinPosts',
    paranoid: true
})
export default class Post extends Model {
    @ForeignKey(() => Board)
    @Column({
        allowNull: false
    })
    boardId: number

    @BelongsTo(() => Board, { onDelete: 'CASCADE' })
    board: Board

    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    message: string
}


export type PostData = Omit<Post, keyof Model>
