import config from './config'
import store from './store'

import Brand from './services/brand/models/brand'
import DiscMold from './services/disc/models/disc'
import PlasticType from './services/disc/models/plastic-type'
import Course from './services/course/models/course'
import Inventory from './services/inventory/models/inventory'
import SMSLogs from './services/sms/models/sms-logs'
import PhoneOptIn from './services/sms/models/phone-opt-in'
import Claim from './services/inventory/models/claim'
import Pickup from './services/inventory/models/pickup'
import VerificationOTP from './services/inventory/models/verification-otp'
import Notification from './services/notification/models/notification'
import Activity from './services/user/models/activity'


;(async function() {
    try {
        await config.init()
        await store.init()

        if (process.env.TABLE_SYNC) {
            await Course.sync({ alter: true })
            await Brand.sync({ alter: true })
            await PlasticType.sync({ alter: true })
            await DiscMold.sync({ alter: true })

            /*
             * claimBy column is generated. Syncing along with it would cause
             * err. Syncing without it would drop it.
             */
            await Inventory.sync({ alter: true })

            await SMSLogs.sync({ alter: true })
            await PhoneOptIn.sync({ alter: true })

            await Claim.sync({ alter: true })
            await Pickup.sync({ alter: true })
            await VerificationOTP.sync({ alter: true })

            await Notification.sync({ alter: true })

            await Activity.sync({ alter: true })
        }

        await store.close()
    } catch(err) {
        console.log(err)
    }
})()
