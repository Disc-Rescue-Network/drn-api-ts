import Handlebars from 'handlebars'

import config from '../../config'

import sendMail from '../email'


const pickupConfirmationTemplate = Handlebars.compile(
    `
    Your pickup schedule has been confirmed. Please pickup the disc {{discName}} at {{courseName}}.
    `
)

const pickupCompleteTemplate = Handlebars.compile(
    `
    Your have picked up disc {{discName}} at {{courseName}}.
    `
)

const defaultMailOptions = {
    from: config.supportEmail
}

function sendPickupConfirmationEmail(to: string, context: { discName: string, courseName: string }) {
    return sendMail({
        ...defaultMailOptions,
        to,
        subject: 'Pickup confirmation of claimed disc',
        html: pickupConfirmationTemplate(context)
    })
}

function sendPickupCompleteEmail(
    to: string,
    context: {
        discName: string,
        courseName: string,
    }
) {
    return sendMail({
        ...defaultMailOptions,
        to,
        html: pickupCompleteTemplate(context)
    })
}

export {
    sendPickupConfirmationEmail,
    sendPickupCompleteEmail
}
