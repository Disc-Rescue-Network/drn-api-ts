import * as fs from 'fs'
import { join } from 'path'

import Handlebars from 'handlebars'

import config from '../../config'

import sendMail from '../email'

const logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAM0AAAA2CAYAAABk6R2zAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2lpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDkuMS1jMDAyIDc5LmI3YzY0Y2NmOSwgMjAyNC8wNy8xNi0xMjozOTowNCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMjgwMTE3NDA3MjA2ODExODIyQUJDMTkyOEMyRDEyRCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQkExMkY0RUEwNEExMUVGOUUwODk4RTZENTU0MjEyNiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQkExMkY0REEwNEExMUVGOUUwODk4RTZENTU0MjEyNiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhCNzE1QTA5NzNCNTExRTRCQUVDOEQ3RjQwMkY4NzJEIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhCNzE1QTBBNzNCNTExRTRCQUVDOEQ3RjQwMkY4NzJEIi8+IDwvcmRmOkRlc2Ny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'

const pcmVerificationTemplate = Handlebars.compile(fs.readFileSync(join(__dirname, 'template', 'verify-pcm.hbs'), 'utf8'))
const pickupConfirmationTemplate = Handlebars.compile(fs.readFileSync(join(__dirname, 'template', 'confirm-pickup.hbs'), 'utf8'))
const pickupCompleteTemplate = Handlebars.compile(fs.readFileSync(join(__dirname, 'template', 'complete-pickup.hbs'), 'utf8'))

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
            logo
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
            logo
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
        html: pickupCompleteTemplate({ ...context, logo })
    })
}

export {
    sendPCMVerificationEmail,
    sendPickupConfirmationEmail,
    sendPickupCompleteEmail,
}
