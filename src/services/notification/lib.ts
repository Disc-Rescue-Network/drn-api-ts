import { Transaction } from 'sequelize'

import Notification, { NotificationData } from './models/notification'


export class NotificationLib {
    create = async (
        data: Omit<NotificationData, 'status'>,
        transaction: Transaction
    ) => {
        return Notification.create(data, { transaction })
    }
}


export default new NotificationLib
