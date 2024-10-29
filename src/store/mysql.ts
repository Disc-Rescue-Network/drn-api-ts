import { Sequelize } from 'sequelize-typescript'

import envConfig from '../config'


export class MySQL {
    public sequelize: Sequelize

    async init() {
        const { dialect, name, host, username, password } = envConfig.dbConfig

        this.sequelize = new Sequelize(
            name,
            username,
            password,
            {
                host,
                dialect,
            }
        )

        this.sequelize.addModels([__dirname + '/../**/models/*.js'])

        if (process.env.DB_SYNC)
            this.sequelize.sync({ alter: true })

        return this.sequelize
    }
}


export default new MySQL
