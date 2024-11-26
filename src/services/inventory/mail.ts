import * as fs from 'fs'
import { join } from 'path'

import Handlebars from 'handlebars'

import config from '../../config'

import sendMail from '../email'

const pcmVerificationTemplate = Handlebars.compile(fs.readFileSync(join(__dirname, 'template', 'verify-pcm.hbs'), 'utf8'))
const pickupConfirmationTemplate = Handlebars.compile(fs.readFileSync(join(__dirname, 'template', 'confirm-pickup.hbs'), 'utf8'))
const pickupCompleteTemplate = Handlebars.compile(fs.readFileSync(join(__dirname, 'template', 'complete-pickup.hbs'), 'utf8'))
const claimRejectionTemplate = Handlebars.compile(fs.readFileSync(join(__dirname, 'template', 'claim-rejection.hbs'), 'utf8'))

const defaultMailOptions = {
    from: {
        name: config.supportName,
        address: config.supportEmail
    }
}

function sendPCMVerificationEmail(
    to: string,
    context: {
        claimId: number,
        discName: string,
        courseName: string,
        color: string,
        plasticType: string
        brand: string,
        otp: string,
    }
) {
    return sendMail({
        ...defaultMailOptions,
        to,
        subject: 'We have received your claim',
        html: pcmVerificationTemplate({
            ...context,
            openTicket: config.drnOpenTicket + `?claimId=${context.claimId}`,
            drnApp: config.drnApp,
            logo: config.drnLogo
        })
    })
}

function sendPickupConfirmationEmail(to: string, context: {
    claimId: number,
    status: string,
    discName: string,
    courseName: string,
    weight: number,
    condition: string,
    pickupDate: string,
    pickupTime: string,
}) {
    return sendMail({
        ...defaultMailOptions,
        to,
        subject: 'Pickup confirmation of claimed disc',
        html: pickupConfirmationTemplate({
            ...context,
            openTicket: config.drnOpenTicket + `?claimId=${context.claimId}`,
            drnApp: config.drnApp,
            logo: config.drnLogo
        })
    })
}

function sendPickupCompleteEmail(
    to: string,
    context: {
        status: string,
        discName: string,
        courseName: string,
        weight: number,
        condition: string,
        pickupDate: string,
        pickupTime: string,
    }
) {
    return sendMail({
        ...defaultMailOptions,
        to,
        subject: 'Pickup is complete',
        html: pickupCompleteTemplate({
            ...context,
            logo: config.drnLogo
        })
    })
}

function sendClaimRejectionEmail(
    to: string,
    context: {
        claimId: number,
        discName: string,
        courseName: string,
        color: string,
        plasticType: string
        brand: string,
        pickupDate: string,
        pickupTime: string,
    }
) {
    return sendMail({
        ...defaultMailOptions,
        to,
        subject: 'Claim Rejection',
        html: claimRejectionTemplate({
            ...context,
            openTicket: config.drnOpenTicket + `?claimId=${context.claimId}`,
            logo: config.drnLogo
        })
    })
}

export {
    sendPCMVerificationEmail,
    sendPickupConfirmationEmail,
    sendPickupCompleteEmail,
    sendClaimRejectionEmail
}
