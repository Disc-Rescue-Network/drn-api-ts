import Handlebars from 'handlebars'

import config from '../../config'

import sendMail from '../email'


const pickupCancellationTemplate = Handlebars.compile(
    `
    Your scheduled pickup of the disc {{discName}} at {{courseName}} has been cancelled.
    `
)

const pickupConfirmationTemplate = Handlebars.compile(
    `
    Your pickup schedule has been confirmed. Please pickup the disc {{discName}} at {{courseName}}.
    `
)

const pickupCompleteTemplate = Handlebars.compile(
    `
    Your have picked up disc {{discName}} at {{courseName}}.
    You can visit {{ticketForm}} and submit a ticket if you did not actually receive it.
    `
)

const defaultMailOptions = {
    from: config.supportEmail
}

function sendPickupCancellationEmail(to: string, context: { discName: string, courseName: string }) {
    return sendMail({
        ...defaultMailOptions,
        to,
        subject: 'Pickup cancellation of claimed disc',
        html: pickupCancellationTemplate(context)
    })
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
        ticketForm: string
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
    sendPickupCancellationEmail,
    sendPickupCompleteEmail
}
