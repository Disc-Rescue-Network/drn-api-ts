import { Transaction } from 'sequelize'

import Activity, { ActivityData } from './models/activity'


export class UserLib {
    logActivity = async (data: ActivityData, transaction?: Transaction) => {
        const jsonData = data.data
        if (jsonData) {
            if (Object.keys(jsonData).length === 0)
                return

            if (!jsonData['diff'] || Object.keys(jsonData['diff']).length === 0)
                return
        }

        return Activity.create(data, { transaction })
    }
}


export default new UserLib
