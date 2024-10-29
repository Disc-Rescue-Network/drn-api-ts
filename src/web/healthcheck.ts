import { Request, Response } from 'express'

import mysql from '../store/mysql'


export default async function (_: Request, res: Response) {
    try {
        await mysql.sequelize.query('SELECT 1')
        res.send('healthy')
    } catch(err) {
        res.status(500).send('sick')
    }
}
