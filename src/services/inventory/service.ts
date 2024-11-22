import Sequelize, { Op } from 'sequelize'
import { escape as sqlEscape } from 'mysql2'
import dayjs from 'dayjs'
import jsonDiff from 'json-diff'

import Inventory, { InventoryData } from './models/inventory'
import Claim, { ClaimData } from './models/claim'
import VerificationOTP from './models/verification-otp'
import Pickup from './models/pickup'
import { INVENTORY_STATUS } from './constant'
import {
    sendPCMVerificationEmail,
    sendPickupConfirmationEmail,
    sendPickupCompleteEmail,
    sendSurrenderEmail
} from './mail'

import Disc from '../disc/models/disc'
import Brand from '../brand/models/brand'
import Course from '../course/models/course'

import { Page, PageOptions } from '../../lib/pagination'
import { generateOTP } from '../../lib/shared'
import { Forbidden, NotFound, ConflictError } from '../../lib/error'

import smslib from '../sms/lib'
import { optInMessage } from '../sms/message'
import { SMSLogsData } from '../sms/models/sms-logs'

import mysql from '../../store/mysql'

import socketService from '../../web/socket/service'
import notificationLib from '../notification/lib'
import { NOTIFICATION_TYPE } from '../notification/constant'

import userLib from '../user/lib'
import { ACTIVITY_TYPE, ACTIVITY_TARGET } from '../user/constant'
import Activity from '../user/models/activity'
import SMSLogs from '../sms/models/sms-logs'

import config from '../../config'


export class InventoryService {
    async init () {
        try {
            const courses = await Course.findAll()
            for (const course of courses)
                await socketService.createRoom({ id: course.orgCode, name: course.name }, { noExpiration: true })
        } catch(err) {
            if (err.code !== 'EXISTS')
                throw err
        }

        return this
    }

    findAll = async (
        pageOptions: PageOptions,
        q: string,
        orgCode: string,
        nonVerified: any,
        nonPending: any,
        nonComplete: any,
        nonVerifiedWithClaims: any,
    ) => {
        const where: any = { deleted: 0 }
        const include: any[] = [
            {
                model: Course
            },
            {
                model: Disc,
                include: Brand
            }
        ]

        if (nonVerified || nonPending || nonComplete || nonVerifiedWithClaims) {
            if (nonVerified) {
                where['$claims.id$'] = null
                include.push({
                    model: Claim,
                    where: {
                        verified: true
                    },
                    required: false
                })
            } else if (nonPending) {
                where[Op.and] = {
                    [Op.or]: [
                        { '$claims.id$': null },
                        { '$claims.verified$': true }
                    ]
                }
                include.push({
                    model: Claim,
                })
            } else if (nonComplete) {
                where['status'] = INVENTORY_STATUS.PENDING_COURSE_PICKUP
                include.push({
                    model: Claim,
                    required: true
                })
            } else if (nonVerifiedWithClaims) {
                include.push({
                    model: Claim,
                    where: {
                        verified: false
                    },
                })
            }
        } else {
            include.push({
                model: Claim
            })
        }

        const query = {
            where,
            include,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
        }

        if (q) {
            const qs = `%${q.toLowerCase()}%`

            query.where[Op.or] = [
                Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Inventory.name')), 'LIKE', qs),
                Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Inventory.name')), 'LIKE', qs),
                Sequelize.literal(`MATCH (Inventory.comments) AGAINST (${sqlEscape(qs)})`),
                { 'phoneNumber': { [Op.like]: qs }},
            ]
        }

        if (orgCode) {
            query.where = {
                ...query.where,
                orgCode,
            }
        } else {
            query.where = {
                ...query.where,
                orgCode: {
                    [Op.ne]: config.drnAdminsOrgCode
                },
            }
        }

        const result = await Inventory.findAndCountAll({
            ...query,
            distinct: true,
            subQuery: false
        })

        const includeClaims: {}[] = [
            {
                model: Course
            },
            {
                model: Disc,
                include: Brand
            }
        ]
        if (nonVerified || nonPending || nonComplete || nonVerifiedWithClaims) {
            if (nonVerified) {
                includeClaims.push({
                    model: Claim,
                    where: {
                        verified: false
                    },
                    required: false
                })
            } else if (nonPending) {
                includeClaims.push({
                    model: Claim,
                    where: {
                        verified: true
                    },
                    required: false
                })
            } else if (nonComplete) {
                where['status'] = INVENTORY_STATUS.PENDING_COURSE_PICKUP
                includeClaims.push({
                    model: Claim,
                    required: true
                })
            } else if (nonVerifiedWithClaims) {
                includeClaims.push({
                    model: Claim,
                    where: {
                        verified: false
                    },
                })
            }
        } else {
            includeClaims.push({ model: Claim })
        }

        const withClaims = await Inventory.findAll({
            where: {
                id: result.rows.map(res => { return res.id })
            },
            include: includeClaims
        })

        return new Page(withClaims, result.count, pageOptions)
    }

    findById = async (id: number) => {
        return Inventory.findByPk(id)
    }

    create = async (
        data: InventoryData,
        orgCode: string,
        user: string
    ) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const inventory = await Inventory.create({ ...data, orgCode }, { transaction })

            await userLib.logActivity(
                {
                    type: ACTIVITY_TYPE.CREATE,
                    objectId: inventory.id,
                    objectType: ACTIVITY_TARGET.INVENTORY,
                    orgCode,
                    user
                },
                transaction
            )

            await transaction.commit()

            return inventory
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    update = async (
        id: number,
        data: Partial<InventoryData>,
        orgCode: string,
        user: string
    ) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const item = await Inventory.findByPk(id, { transaction })

            const beforeUpdate = Object.assign({}, item.dataValues)

            const afterUpdate = await item.update(data, { transaction })

            const diff = jsonDiff.diff(beforeUpdate, afterUpdate.dataValues)

            await userLib.logActivity({
                type: ACTIVITY_TYPE.UPDATE,
                objectId: item.id,
                objectType: ACTIVITY_TARGET.INVENTORY,
                orgCode,
                user,
                data: { diff }
            }, transaction)

            await transaction.commit()

            return afterUpdate
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    getUnclaimedInventory = async (phoneNumber: string) => {
        return Inventory.findAll({
            where: {
                phoneNumber: { [Op.like]: '%' + phoneNumber },
                status: ['UNCLAIMED', 'NEW'],
                deleted: 0
            }
        })
    }

    verifyPCM = async (
        data: {
            vid: number,
            otp: string,
            tofAccepted: boolean,
            surrenderRequested?: boolean
        }
    ) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const otp = await VerificationOTP.findOne({
                where: { id: data.vid },
                include: [
                    { model: Claim, include: [Inventory] }
                ],
                order: [['createdAt', 'DESC']],
                transaction
            })
            if (!otp)
                throw new NotFound('No such verification is pending')

            const diff = Date.now() - (new Date(otp.updatedAt)).getTime()
            if (diff > 86400000)
                throw new Forbidden('OTP has expired')

            if (otp.otp !== data.otp)
                throw new Forbidden('Incorrect OTP')

            if (!otp.phoneNumberMatches) {
                if (!data.tofAccepted)
                    throw new Forbidden('Phone numbers on disc and in claim do not match. You need to accept the TOF as well.')

                await otp.claim.update(
                    {
                        tofAccepted: data.tofAccepted,
                        pcmVerified: true,
                        surrendered: data.surrenderRequested ? true : false
                    },
                    { transaction }
                )
            } else {
                /*
                 * As phone number in claim matches on disc, no need for manual
                 * admin verification. Directly mark it verified.
                 */
                if (otp.claim.surrendered) {
                    await otp.claim.update({
                        verified: true,
                        pcmVerified: true,
                    }, { transaction })

                    const beforeUpdate = Object.assign({}, otp.claim.item.dataValues)

                    await otp.claim.item.update({
                        status: INVENTORY_STATUS.SURRENDERED
                    }, { transaction })

                    const diff = jsonDiff.diff(beforeUpdate, otp.claim.item.dataValues)
                    await userLib.logActivity({
                        type: ACTIVITY_TYPE.UPDATE,
                        objectId: otp.claim.item.id,
                        objectType: ACTIVITY_TARGET.INVENTORY,
                        orgCode: otp.claim.item.orgCode,
                        data: { diff }
                    }, transaction)
                } else {
                    await otp.claim.update(
                        {
                            verified: true,
                            pcmVerified: true,
                            surrendered: data.surrenderRequested ? true : false
                        },
                        { where: { id: otp.claimId }, transaction, validate: false }
                    )
                }
            }

            await VerificationOTP.destroy({ where: { id: data.vid }, transaction })

            await transaction.commit()

            return 'Verified successfully'
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    resendVerificationOTP = async (claimId: number) => {
        let v = await VerificationOTP.findOne(
            { where: { claimId } }
        )

        const claim = await Claim.findByPk(
            claimId,
            {
                include: [
                    {
                        model: Inventory,
                        include: [
                            {
                                model: Disc,
                                include: [Brand]
                            }
                        ]
                    },
                    {
                        model: Pickup,
                        include: [Course]
                    }
                ]
            }
        )

        if (claim.item.status !== INVENTORY_STATUS.UNCLAIMED)
            throw new NotFound('Disc is no longer up for claim')

        const otp = generateOTP()
        const message = `DRN: Looks like you found your disc in one of our beacons. Use code "${otp}" to verify that it's really you.`

        if (!v) {
            v = await VerificationOTP.create({
                claimId,
                otp,
                phoneNumberMatches: claim.phoneNumber === claim.item.phoneNumber
            })
        } else {
            await v.update({ otp })
        }

        if (claim.phoneNumber) {
            await smslib.sendSMS(claim.phoneNumber, message)
        } else {
            await sendPCMVerificationEmail(claim.email, {
                claimId: claim.id,
                discName: claim.item.disc.name,
                color: claim.item.color,
                brand: claim.item.disc.brand.name,
                plasticType: claim.item.disc.plasticType,
                courseName: claim.pickup.course.name,
                otp
            })
        }

        return { claim, vid: v.id }
    }

    claimItem = async (data: ClaimData) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const item = await Inventory.findByPk(data.itemId, { transaction })

            if (!item)
                throw new NotFound('No such disc to claim')

            const course = await Course.findByPk(data.pickup.courseId, { transaction })

            if (item.orgCode !== course.orgCode)
                throw new Forbidden('Pickup should mention the same course where the disc was recovered from')

            if (item.status !== INVENTORY_STATUS.UNCLAIMED)
                throw new Forbidden('The item is no longer up for claim')

            const prevClaim = await Claim.findOne({
                where: {
                    [Op.and]: [
                        data.phoneNumber ? { phoneNumber: data.phoneNumber } : { email: data.email },
                        { itemId: data.itemId },
                    ]
                },
                transaction
            })
            if (prevClaim)
                throw new ConflictError('You have already submitted the claim')

            const claim = await Claim.create(data, { transaction, include: Pickup })

            let v: VerificationOTP

            const otp = generateOTP()

            /*
             * If the PCM is phone number and matches the phone number on the
             * disc, no admin verification needed
             */
            if (data.phoneNumber) {
                if (!item.phoneNumber || data.phoneNumber !== item.phoneNumber) {
                    v = await VerificationOTP.create({
                        claimId: claim.id,
                        otp
                    }, { transaction })
                } else if (data.phoneNumber === item.phoneNumber) {
                    v = await VerificationOTP.create({
                        claimId: claim.id,
                        otp,
                        phoneNumberMatches: true
                    }, { transaction })
                }
            } else {
                v = await VerificationOTP.create({
                    claimId: claim.id,
                    otp
                }, { transaction })
            }

            const currentClaim = await Claim.findByPk(
                claim.id,
                {
                    include: [
                        {
                            model: Inventory,
                            include: [
                                {
                                    model: Disc,
                                    include: [Brand]
                                }
                            ]
                        },
                        {
                            model: Pickup,
                            include: [Course]
                        }
                    ],
                    transaction
                }
            )

            const notif = await notificationLib.create(
                {
                    type: NOTIFICATION_TYPE.CLAIM,
                    message: `A claim for ${currentClaim.item.disc.name} at ${currentClaim.pickup.course.name} has been received`,
                    objectId: currentClaim.id,
                    objectType: NOTIFICATION_TYPE.CLAIM,
                    orgCode: currentClaim.pickup.course.orgCode
                },
                transaction
            )

            if (data.phoneNumber) {
                await smslib.sendSMS(
                    data.phoneNumber,
                    `DRN: Looks like you found your disc in one of our beacons. Use code "${otp}" to verify that it's really you.`,
                )
            } else {
                await sendPCMVerificationEmail(currentClaim.email, {
                    claimId: currentClaim.id,
                    discName: currentClaim.item.disc.name,
                    color: currentClaim.item.color,
                    brand: currentClaim.item.disc.brand.name,
                    plasticType: currentClaim.item.disc.plasticType,
                    courseName: currentClaim.pickup.course.name,
                    otp
                })
            }

            await transaction.commit()

            await socketService.sendToRoom(
                currentClaim.pickup.course.orgCode,
                {
                    eventName: 'newClaim',
                    message: notif.message,
                    notificationId: notif.id,
                    data: currentClaim
                }
            )

            return { claim, vid: v.id }
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    verifyClaim = async (data: { claimId: number, verified: boolean }) => {
        const claim = await Claim.findOne({
            where: { id: data.claimId },
            include: [Inventory]
        })

        if (data.verified) {
            const verifiedClaim = await Claim.findOne({
                where: { verified: true, itemId: claim.itemId }
            })
            if (verifiedClaim && verifiedClaim.id !== data.claimId)
                throw new ConflictError('Another claim has already been verified')
        }

        await claim.update({ verified: data.verified })

        return claim
    }

    getFormattedScheduleDate = (scheduledOn: string | Date) => {
        let so = dayjs(scheduledOn).tz('EST')

        let soString = ''
        if (dayjs().tz('EST').week() === so.week()) {
            soString = so.format('dddd @ ha')
        } else {
            soString = so.format('MM/DD @ ha')
        }

        return soString
    }

    confirmPickup = async (
        data: {
            pickupId: number,
            scheduledOn?: string,
            reScheduledOn?: string
        },
        user: string
    ) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const pickup = await Pickup.findByPk(data.pickupId, {
                include: [
                    Course,
                    {
                        model: Claim,
                        include: [
                            {
                                model: Inventory,
                                include: [Disc]
                            }
                        ],
                    }
                ],
                transaction
            })
            if (!pickup)
                throw new NotFound('No such pickup')

            if (!pickup.claim.verified)
                throw new Forbidden('Pickup can not be confirmed without verification')

            if ([ INVENTORY_STATUS.CLAIMED, INVENTORY_STATUS.SOLD, INVENTORY_STATUS.FOR_SALE, INVENTORY_STATUS.SURRENDERED, INVENTORY_STATUS.SOLD_OFFLINE ].includes(pickup.claim.item.status))
                throw new Forbidden('The item is no longer up for claim')

            if (pickup.claim.surrendered)
                throw new Forbidden('The item is to be surrendered')

            let message = ''
            let soString = ''

            if (data.scheduledOn) {
                if (pickup.scheduledOn)
                    throw new Forbidden('Pickup has already been confirmed')

                await pickup.update({ scheduledOn: data.scheduledOn }, { transaction })

                const beforeUpdate = Object.assign({}, pickup.claim.item.dataValues)

                await pickup.claim.item.update({ status: INVENTORY_STATUS.PENDING_COURSE_PICKUP }, { transaction })

                const diff = jsonDiff.diff(beforeUpdate, pickup.claim.item.dataValues)
                await userLib.logActivity({
                    type: ACTIVITY_TYPE.UPDATE,
                    objectId: pickup.claim.item.id,
                    objectType: ACTIVITY_TARGET.INVENTORY,
                    orgCode: pickup.claim.item.orgCode,
                    user,
                    data: { diff }
                }, transaction)

                soString = this.getFormattedScheduleDate(data.scheduledOn)
                message = `DRN: Congrats on claiming your disc! You pickup has been confirmed and scheduled for: ${soString} at ${pickup.course.name}. Text TICKET if you need to make changes or don't receive your disc.`
            }

            if (data.reScheduledOn) {
                if (!pickup.scheduledOn)
                    throw new Forbidden('Pickup is not scheduled')

                /*
                 * If pickup is being rescheduled ALMOST within the same hour
                 */
                if (Math.abs(dayjs(data.reScheduledOn).diff(dayjs(pickup.scheduledOn))) < 3500000)
                    throw new Forbidden('Pickup is being rescheduled on same time as before')

                await pickup.update({ scheduledOn: data.reScheduledOn }, { transaction })

                soString = this.getFormattedScheduleDate(data.reScheduledOn)
                message = `Your pickup has been modified by the ${pickup.course.name}. Your new pickup date is ${soString}. If you need to change or adjust your pickup text Ticket to open a ticket.`
            }

            if (pickup.claim.email) {
                await sendPickupConfirmationEmail(pickup.claim.email, {
                    claimId: pickup.claim.id,
                    status: data.scheduledOn ? 'confirmed' : 'rescheduled',
                    discName: pickup.claim.item.disc.name,
                    courseName: pickup.course.name,
                    weight: pickup.claim.item.weight,
                    condition: pickup.claim.item.condition,
                    pickupDate: soString.split(' @ ')[0],
                    pickupTime: soString.split(' @ ')[1],
                })
            } else {
                await smslib.sendSMS(pickup.claim.phoneNumber, message)
            }

            await transaction.commit()

            return 'Pickup confirmed'
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    findAllClaims = async (
        pageOptions: PageOptions,
        q: string,
    ) => {
        const where: any = {}
        const include: any[] = [
            {
                model: Inventory,
            },
            {
                model: Pickup,
                include: Course
            }
        ]

        const query = {
            where,
            include,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
        }

        if (q) {
            const qs = `%${q.toLocaleLowerCase()}%`

            query.where[Op.or] = [
                Sequelize.literal(`MATCH (comments) AGAINST (${sqlEscape(qs)})`),
                { 'phoneNumber': { [Op.like]: qs }},
            ]
        }

        const result = await Claim.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }

    completePickup = async (id: number, user: string) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const pickup = await Pickup.findByPk(id, {
                include: [
                    {
                        model: Claim,
                        include: [
                            { model: Inventory, include: [Disc] }
                        ]
                    },
                    {
                        model: Course,
                    }
                ],
                transaction
            })

            if (!pickup)
                throw new NotFound('No such pickup')

            if ([ INVENTORY_STATUS.CLAIMED, INVENTORY_STATUS.SOLD, INVENTORY_STATUS.FOR_SALE, INVENTORY_STATUS.SURRENDERED, INVENTORY_STATUS.SOLD_OFFLINE ].includes(pickup.claim.item.status))
                throw new Forbidden('Item is no longer up for pickup')

            if (!pickup.claim.verified)
                throw new Forbidden('Item hand-over is not allowed as claim has not been verified')

            if (pickup.claim.surrendered)
                throw new Forbidden('The item is to be surrendered')

            if (!pickup.scheduledOn)
                throw new Forbidden('Item hand-over is not allowed as pickup has not been confirmed')

            const beforeUpdate = Object.assign({}, pickup.claim.item.dataValues)

            await pickup.claim.item.update(
                {
                    status: INVENTORY_STATUS.CLAIMED,
                    dateClaimed: new Date
                },
                { where: { id: pickup.claim.itemId }, transaction }
            )

            const diff = jsonDiff.diff(beforeUpdate, pickup.claim.item.dataValues)
            await userLib.logActivity({
                type: ACTIVITY_TYPE.UPDATE,
                objectId: pickup.claim.item.id,
                objectType: ACTIVITY_TARGET.INVENTORY,
                orgCode: pickup.claim.item.orgCode,
                user,
                data: { diff }
            }, transaction)

            const soString = this.getFormattedScheduleDate(pickup.scheduledOn)
            if (pickup.claim.email) {
                await sendPickupCompleteEmail(pickup.claim.email, {
                    status: 'complete',
                    discName: pickup.claim.item.disc.name,
                    courseName: pickup.course.name,
                    weight: pickup.claim.item.weight,
                    condition: pickup.claim.item.condition,
                    pickupDate: soString.split(' @ ')[0],
                    pickupTime: soString.split(' @ ')[1],
                })
            } else {
                const message = `DRN: Lost discs finding their way home are why we do this! Congrats on bringing your ${pickup.claim.item.disc.name} home from ${pickup.course.name}. Text TICKET if there are any issues.`
                await smslib.sendSMS(pickup.claim.phoneNumber, message)
            }

            await transaction.commit()

            return pickup.claim.item
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    surrenderDisc = async (claimId: number) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const claim = await Claim.findByPk(
                claimId,
                {
                    include: [
                        {
                            model: Inventory,
                            include: [Disc]
                        },
                        {
                            model: Pickup,
                            include: [Course]
                        }
                    ]
                }
            )

            if (!claim)
                throw new NotFound('No such claim')

            if (claim.surrendered)
                throw new ConflictError('Surrendered already')

            if ([INVENTORY_STATUS.CLAIMED].includes(claim.item.status))
                throw new Forbidden('Item is no longer up for surrender')

            let v = await VerificationOTP.findOne({
                where: { claimId },
                transaction
            })

            const otp = generateOTP()

            if (!v) {
                v = await VerificationOTP.create({
                    claimId,
                    otp,
                    phoneNumberMatches: claim.phoneNumber === claim.item.phoneNumber
                })
            } else {
                await v.update({ otp }, { transaction })
            }

            /*
             * Admin can verify a claim even if PCM is not yet verified. So
             * resetting verified flag whether phone number matches or not is
             * not needed.
             */
            await claim.update({ pcmVerified: false }, { transaction })

            const beforeUpdate = Object.assign({}, claim.item.dataValues)

            await claim.item.update({ status: INVENTORY_STATUS.UNCLAIMED }, { transaction })

            const diff = jsonDiff.diff(beforeUpdate, claim.item.dataValues)
            await userLib.logActivity({
                type: ACTIVITY_TYPE.UPDATE,
                objectId: claim.item.id,
                objectType: ACTIVITY_TARGET.INVENTORY,
                orgCode: claim.item.orgCode,
                data: { diff }
            }, transaction)

            if (claim.phoneNumber)
                await smslib.sendSMS(
                    claim.phoneNumber,
                    `DRN: Looks like you found your disc in one of our beacons. Use code "${otp}" to verify that it's really you.`,
                )
            else {
                await sendSurrenderEmail(claim.email, {
                    discName: claim.item.disc.name,
                    courseName: claim.pickup.course.name,
                    otp
                })
            }

            await transaction.commit()

            return { claim, vid: v.id }
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    findClaimById = async (id: number) => {
        return Claim.findByPk(id, {
            include: [Inventory]
        })
    }

    findPickupById = async (id: number) => {
        return Pickup.findByPk(id, {
            include: [
                {
                    model: Course,
                }
            ],
            raw: true,
            nest: true
        })
    }

    findActivities = async (
        pageOptions: PageOptions,
        orgCode: string,
        itemId?: number
    ) => {
        const where: any = {
            orgCode,
            objectType: ACTIVITY_TARGET.INVENTORY,
        }

        if (itemId)
            where['objectId'] = itemId

        const query = {
            where,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
            raw: true,
            nest: true
        }

        const result = await Activity.findAndCountAll(query)

        const invObjects = await Inventory.findAll({ where: { id: result.rows.map(notif => { return notif.objectId })}})
        for (const activity of result.rows) {
            for (const inv of invObjects) {
                if (activity.objectId === inv.id)
                    inv['inv'] = inv
            }
        }

        return new Page(result.rows, result.count, pageOptions)
    }

    sendSMS = async (
        data: Omit<SMSLogsData, 'sentAt' | 'recipientPhone'> & {
            initialText: boolean,
            sentAt: Date
        }
    ) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const item = await Inventory.findByPk(data.itemId, { transaction })
            if (!item)
                throw new NotFound('No such inventory item')

            const recipientPhone = item.phoneNumber

            if (data.initialText) {
                const optInStatus = await smslib.getOptInStatus(recipientPhone, transaction)

                let setDateTexted = false

                if (optInStatus === null) {
                    // request opt in
                    await smslib.sendSMS(
                        recipientPhone,
                        optInMessage
                    )

                    setDateTexted = true
                } else if (optInStatus.smsConsent) {
                    // Log the custom SMS
                    await smslib.insertSmsLog({
                        ...data,
                        recipientPhone,
                        sentAt: new Date(),
                    }, transaction)

                    // user is opted in, send text
                    await smslib.sendSMS(
                        recipientPhone,
                        data.message
                    )

                    setDateTexted = true
                }

                if (setDateTexted) {
                    await Inventory.update(
                        {
                            dateTexted: new Date(new Date().toISOString().split('T')[0]),
                        },
                        { where: { id: data.itemId }, transaction }
                    )
                }
            } else {
                // Log the custom SMS
                await smslib.insertSmsLog({
                    ...data,
                    recipientPhone,
                    sentAt: new Date(),
                }, transaction)

                await smslib.sendSMS(
                    recipientPhone,
                    data.message
                )
            }

            await transaction.commit()

            return 'SMS sent successfully'
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    findAllSMS = async (
        pageOptions: PageOptions,
        itemId?: number,
    ) => {
        const where: {} = {}
        const include: any[] = []

        if (itemId)
            where['itemId'] = itemId

        const query = {
            where,
            include,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
        }

        const result = await SMSLogs.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }

    createTicketNotification = async (claimId: number) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const claim = await Claim.findByPk(
                claimId,
                {
                    include: [
                        {
                            model: Inventory,
                            include: [
                                {
                                    model: Disc,
                                    include: [Brand]
                                }
                            ]
                        },
                        {
                            model: Pickup,
                            include: [Course]
                        }
                    ],
                    transaction
                }
            )

            if (!claim)
                throw new NotFound('No such claim')

            let contact = claim.email
            let contactMethod = 'email'
            if (claim.phoneNumber) {
                contact = claim.phoneNumber
                contactMethod = 'phone'
            }

            let message = `Someone needs to reach out directly to ${contactMethod} ${contact} for help`
            if (claim.firstName || claim.lastName)
                message = `${[claim.firstName, claim.lastName].join(' ')} has asked for someone to reach out to them directly via ${contactMethod} @ ${contact} for help`

            const notif = await notificationLib.create(
                {
                    type: NOTIFICATION_TYPE.CLAIM_TICKET,
                    message,
                    objectId: claim.id,
                    objectType: NOTIFICATION_TYPE.CLAIM_TICKET,
                    orgCode: claim.pickup.course.orgCode
                },
                transaction
            )

            await socketService.sendToRoom(
                claim.pickup.course.orgCode,
                {
                    eventName: 'claimTicket',
                    message: notif.message,
                    notificationId: notif.id,
                    data: claim
                }
            )

            await transaction.commit()

            return notif
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    deleteClaim = async (claimId: number) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const claim = await Claim.findByPk(
                claimId,
                {
                    include: [
                        {
                            model: Inventory,
                        },
                    ],
                    transaction
                }
            )

            if (claim.verified && claim.item.status === INVENTORY_STATUS.CLAIMED)
                throw new Forbidden('Items has been claimed with this one')

            if (claim.verified) {
                await claim.update({ verified: false })
                await claim.item.update(
                    { status: INVENTORY_STATUS.UNCLAIMED },
                    { transaction }
                )
            }

            await claim.destroy({ transaction })

            await transaction.commit()

            return claim
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }
}


export default new InventoryService
