import config from './config'
import store from './store'

import UserAccount from './services/user/models/account'
import Brand from './services/brand/models/brand'
import DiscMold from './services/disc/models/disc'
import Course from './services/course/models/course'
import Inventory from './services/inventory/models/inventory'
import SMSLogs from './services/sms/models/sms-logs'
import PhoneOptIn from './services/sms/models/phone-opt-in'


;(async function() {
    await config.init()
    await store.init()

    if (process.env.TABLE_SYNC) {
        await UserAccount.sync({ alter: true })
        await Brand.sync({ alter: true })
        await DiscMold.sync({ alter: true })
        await Course.sync({ alter: true })
        await Inventory.sync({ alter: true })
        await SMSLogs.sync({ alter: true })
        await PhoneOptIn.sync({ alter: true })
    }

    await store.close()
})()
