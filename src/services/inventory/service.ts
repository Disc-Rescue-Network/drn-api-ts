import Sequelize, { Op } from 'sequelize'
import { escape as sqlEscape } from 'mysql2'

import Inventory, { InventoryData } from './models/inventory'
import Claim, { ClaimData } from './models/claim'
import VerificationOTP from './models/verification-otp'
import Pickup from './models/pickup'
import { INVENTORY_STATUS } from './constant'
import {
    sendPickupConfirmationEmail,
    sendPickupCancellationEmail,
    sendPickupCompleteEmail
} from './mail'

import Disc from '../disc/models/disc'
import Brand from '../brand/models/brand'
import Course from '../course/models/course'

import { Page, PageOptions } from '../../lib/pagination'
import { generateOTP } from '../../lib/shared'
import { Forbidden, NotFound, ConflictError } from '../../lib/error'

import smslib from '../sms/lib'

import mysql from '../../store/mysql'


export class InventoryService {
    init () {
        return this
    }

    findAll = async (
        pageOptions: PageOptions,
        q: string,
        orgCode: string
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

        const query = {
            where,
            include,
            offset: pageOptions.offset,
            limit: pageOptions.limit,
            raw: true,
            nest: true,
        }

        if (q) {
            const qs = `%${q.toLocaleLowerCase()}%`

            query.where[Op.or] = [
                Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Inventory.name')), 'LIKE', qs),
                Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Inventory.name')), 'LIKE', qs),
                Sequelize.literal(`MATCH (comments) AGAINST (${sqlEscape(qs)})`),
                { 'phoneNumber': { [Op.like]: qs }},
            ]
        }

        if (orgCode) {
            query.where = {
                ...query.where,
                orgCode,
            }
        }

        const result = await Inventory.findAndCountAll(query)

        return new Page(result.rows, result.count, pageOptions)
    }

    findById = async (id: number) => {
        return Inventory.findByPk(id)
    }

    create = async (data: InventoryData) => {
        return Inventory.create(data)
    }

    update = async (id: number, data: Partial<InventoryData>) => {
        return Inventory.update(data, { where: { id } })
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

    verifyPCM = async (data: { vid: number, otp: string, tofAccepted: boolean }) => {
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

            const diff = Date.now() - (new Date(otp.createdAt)).getTime()
            if (diff > 86400000)
                throw new Forbidden('OTP has expired')

            if (otp.otp !== data.otp)
                throw new Forbidden('Incorrect OTP')

            if (!otp.phoneNumberMatches) {
                if (!data.tofAccepted)
                    throw new Forbidden('Phone numbers on disc and in claim do not match. You need to accept the TOF as well.')

                await Claim.update(
                    { tofAccepted: data.tofAccepted },
                    { where: { id: otp.claimId }, transaction, validate: false }
                )
            } else {
                /*
                 * As phone number in claim matches on disc, no need for manual
                 * admin verification. Directly mark it verified.
                 */
                if (otp.claim.surrendered)
                    await otp.claim.item.update({ status: INVENTORY_STATUS.SURRENDERED })
                else
                    await otp.claim.update(
                        { verified: true },
                        { where: { id: otp.claimId }, transaction, validate: false }
                    )
            }

            await VerificationOTP.destroy({ where: { id: data.vid }, transaction })

            await transaction.commit()

            return 'Verified successfully'
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    claimItem = async (data: ClaimData) => {
        const transaction = await mysql.sequelize.transaction()

        const item = await Inventory.findByPk(data.itemId, { transaction })

        if (!item)
            throw new NotFound('No such disc to claim')

        if (item.status !== INVENTORY_STATUS.UNCLAIMED)
            throw new Forbidden('The item is no longer up for claim')

        const prevClaim = await Claim.findOne({
            where: {
                userId: data.userId,
                itemId: data.itemId,
            }
        })
        if (prevClaim)
            throw new ConflictError('You have already submitted the claim')

        try {
            const claim = await Claim.create(data, { transaction, include: Pickup })

            /*
             * If the PCM is phone number and matches the phone number on the
             * disc, no admin verification needed
             */
            if (data.phoneNumber) {
                const otp = generateOTP()

                let message = ''

                if (!item.phoneNumber || data.phoneNumber !== item.phoneNumber) {
                    const v = await VerificationOTP.create({
                        claimId: claim.id,
                        otp
                    }, { transaction })

                    const link = `http://localhost/inventory/claim/verify?claimId=${claim.id}&vid=${v.id}`

                    if (claim.surrendered) {
                        message = `Disc Rescue Network (DRN): We’ve received your claim request to surrender the disc! please visit ${link} and use the OTP ${otp} to verify your phone number associated with the claim before we move it our store.`
                    } else {
                        message = `Disc Rescue Network (DRN): We’ve received your claim request! please visit ${link} and use the OTP ${otp} to verify your phone number associated with the claim.`
                    }
                } else if (data.phoneNumber === item.phoneNumber) {
                    const v = await VerificationOTP.create({
                        claimId: claim.id,
                        otp,
                        phoneNumberMatches: true
                    }, { transaction })

                    const link = `http://localhost/inventory/claim/verify?claimId=${claim.id}&vid=${v.id}&phoneNumberMatches=1`

                    if (claim.surrendered) {
                        message = `Disc Rescue Network (DRN): We’ve received your claim request! please visit ${link} and use the OTP ${otp} to verify your phone number before we move it to our store`
                    } else {
                        message = `Disc Rescue Network (DRN): We’ve received your claim request! please visit ${link} and use the OTP ${otp} to verify your phone number`
                    }
                }

                await smslib.sendSMS(message, data.phoneNumber)
            }

            await transaction.commit()

            return claim
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }

    verifyClaim = async (data: { claimId: number, verified: boolean }) => {
        const result = await Claim.update(
            { verified: data.verified },
            { where: { id: data.claimId }, validate: false }
        )
        if (result[0])
            return 'Record updated'

        return 'No record updated'
    }

    confirmPickup = async (data: { pickupId: number, confirmed?: boolean, cancelled?: boolean }) => {
        const transaction = await mysql.sequelize.transaction()

        try {
            const pickup = await Pickup.findByPk(data.pickupId, {
                include: [Course],
                transaction
            })
            if (!pickup)
                throw new NotFound('No such pickup')

            const claim = await Claim.findByPk(pickup.claimId, {
                include: [
                    {
                        model: Inventory,
                        include: [Disc]
                    }
                ],
                transaction
            })

            if (!claim.verified)
                throw new Forbidden('Pickup can not be confirmed without verification')

            if (claim.item.status !== INVENTORY_STATUS.UNCLAIMED)
                throw new Forbidden('The item is no longer up for claim')

            if (pickup.claim.surrendered)
                throw new Forbidden('The item is to be surrendered')

            const ticketForm = `http://localhost/inventory/claim/ticket`

            if (data.confirmed) {
                if (pickup.confirmed)
                    throw new Forbidden('Pickup has already been confirmed')

                await pickup.update({ confirmed: data.confirmed }, { transaction })
                await pickup.claim.item.update({ status: INVENTORY_STATUS.PENDING_DROPOFF }, { transaction })

                if (claim.email) {
                    await sendPickupConfirmationEmail(claim.email, {
                        discName: claim.item.disc.name,
                        courseName: pickup.course.name
                    })
                } else {
                    const message = `
                    Disc Rescue Network (DRN): We’ve confirmed your pickup schedule!

                    Please pickup your disc at ${claim.item.disc.name} at ${pickup.course.name}

                    You can visit ${ticketForm} and submit a ticket if you do not receive it
                    `
                    await smslib.sendSMS(message, claim.phoneNumber)
                }
            }

            if (data.cancelled) {
                if (pickup.confirmed) {
                    await pickup.update({ confirmed: data.cancelled }, { transaction })
                    await pickup.claim.item.update({ status: INVENTORY_STATUS.UNCLAIMED }, { transaction })

                    if (claim.email) {
                        await sendPickupCancellationEmail(claim.email, {
                            discName: claim.item.disc.name,
                            courseName: pickup.course.name
                        })
                    } else {
                        const message = `
                        Disc Rescue Network (DRN): We’ve cancelled your pickup schedule of ${claim.item.disc.name} at ${pickup.course.name}!

                        You can visit ${ticketForm} and submit a ticket
                        `
                        await smslib.sendSMS(message, claim.phoneNumber)
                    }
                } else
                    throw new ConflictError('No confirmed pickup to cancel')
            }

            await transaction.commit()

            if (data.confirmed)
                return 'Pickup confirmed'

            if (data.cancelled)
                return 'Pickup cancelled'
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
            raw: true,
            nest: true,
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

    completePickup = async (id: number) => {
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

            if (pickup.claim.item.status === INVENTORY_STATUS.CLAIMED)
                throw new Forbidden('Item has already been claimed')

            if (!pickup.claim.verified)
                throw new Forbidden('Item hand-over is not allowed as claim has not been verified')

            if (pickup.claim.surrendered)
                throw new Forbidden('The item is to be surrendered')

            if (!pickup.confirmed)
                throw new Forbidden('Item hand-over is not allowed as pickup has not been confirmed')

            await pickup.claim.item.update(
                { status: INVENTORY_STATUS.CLAIMED },
                { where: { id: pickup.claim.itemId }, transaction }
            )

            const ticketForm = `http://localhost/inventory/claim/ticket`

            if (pickup.claim.email) {
                await sendPickupCompleteEmail(pickup.claim.email, {
                    discName: pickup.claim.item.disc.name,
                    courseName: pickup.course.name,
                    ticketForm
                })
            } else {
                const message = `
                Disc Rescue Network (DRN): You have picked up ${pickup.claim.item.disc.name} at ${pickup.course.name}!

                You can visit ${ticketForm} and submit a ticket if you did not actually receive it
                `
                await smslib.sendSMS(message, pickup.claim.phoneNumber)
            }

            await transaction.commit()

            return pickup.claim.item
        } catch(err) {
            await transaction.rollback()
            throw err
        }
    }
}


export default new InventoryService
