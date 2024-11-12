import { Transaction } from 'sequelize'

import Activity, { ActivityData } from './models/activity'


export class UserLib {
    logActivity = async (data: ActivityData, transaction?: Transaction) => {
        return Activity.create(data, { transaction })
    }
}


export default new UserLib
