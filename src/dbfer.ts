import { Sequelize } from 'sequelize-typescript'

import config from './config'
import store from './store'

import UserAccount from './services/user/models/account'
import Brand from './services/brand/models/brand'
import DiscMold from './services/disc/models/disc'
import Course from './services/course/models/course'
import Inventory from './services/inventory/models/inventory'
import PhoneOptIn from './services/sms/models/phone-opt-in'
import SMSLogs from './services/sms/models/sms-logs'


const oldDb = new Sequelize(
    'discgolfdb',
    'santosh',
    'Sant0sh',
    {
        host: 'localhost',
        dialect: 'mysql',
    }
)

;(async function() {
    await config.init()
    await store.init()

    if (0) {
        const accounts = await oldDb.query('select * from user_accounts')

        const accs = []
        accounts[0].forEach((ac: any) => {
            accs.push({
                id: ac.user_id,
                firstName: ac.first_name,
                lastName: ac.last_name,
                phoneNumber: ac.phone_number,
                email: ac.email,
                textingOptInStatus: ac.texting_opt_in_status ? true : false,
                accountType: ac.account_type,
                homeCourse: ac.home_course,
                udiscDisplayName: ac.udisc_display_name,
                kindeId: ac.kinde_id,
            })
        })

        UserAccount.bulkCreate(accs)
    } else if (0) {
        const brands = await oldDb.query('select * from brands')

        const bs = []
        brands[0].forEach((b: any) => {
            bs.push({
                id: b.BrandID,
                name: b.BrandName
            })
        })

        Brand.bulkCreate(bs)
    } else if (0) {
        const discs = await oldDb.query('select * from disc_molds')

        const ds = []
        discs[0].forEach((d: any) => {
            ds.push({
                id: d.MoldId,
                name: d.MoldName,
                brandId: d.BrandID,
                plasticType: d.PlasticType,
                category: d.Category
            })
        })

        DiscMold.bulkCreate(ds)
    } else if (0) {
        const courses = await oldDb.query('select * from courses')

        const cs = []
        courses[0].forEach((c: any) => {
            cs.push(c)
        })

        Course.bulkCreate(cs)
    } else if (1) {
        const inventory = await oldDb.query('select * from found_discs')

        const inv = []
        inventory[0].forEach((i: any) => {
            inv.push({
                ...i,
                deleted: i.deleted ? true : false
            })
        })

        Inventory.bulkCreate(inv)
    } else if (0) {
        const phoneOptIns = await oldDb.query('select * from phone_opt_ins')

        const poi = []
        phoneOptIns[0].forEach((p: any) => {
            poi.push({
                phoneNumber: p.id,
                smsConsent: p.sms_consent ? true : false,
            })
        })

        PhoneOptIn.bulkCreate(poi, { validate: true })
    } else if (0) {
        const smsLogs = await oldDb.query('select * from sms_logs')

        const logs = []
        smsLogs[0].forEach((log: any) => {
            logs.push({
                id: log.id,
                discId: log.disc_id,
                message: log.message,
                sentBy: log.sent_by,
                recipientPhone: log.recipient_phone,
                sentAt: log.sent_at,
            })
        })

        SMSLogs.bulkCreate(logs, { validate: true })
    }
})()
