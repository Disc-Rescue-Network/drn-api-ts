import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'

import config from '../config'

import { InternalServerError } from '../lib/error'


const transport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: config.supportEmail,
        pass: config.supportEmailPassword
    }
})


export default async (mailOptions: SendMailOptions) => {
    try {
        await transport.sendMail(mailOptions)
    } catch(err) {
        console.log(err)
        throw new InternalServerError('Failed to send mail')
    }
}
