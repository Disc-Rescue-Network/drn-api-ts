import { Dialect } from 'sequelize'

import { validateOrReject, IsArray, IsInt, IsString, IsEmail } from 'class-validator'


export class DatabaseConfig {
    @IsString()
    dialect: Dialect

    @IsString()
    name: string

    @IsString()
    host: string

    @IsString()
    username: string

    @IsString()
    password: string
}


export class EnvConfig {
    @IsInt()
    port: number

    @IsString()
    authIssuer: string

    @IsString()
    authAudience: string

    @IsArray()
    autoAttributes: string[]

    @IsString()
    twilioAuthToken: string

    @IsString()
    twilioSID: string

    @IsString()
    twilioSendFrom: string

    @IsString()
    twilioWebhookURL: string

    @IsString()
    twilio_vcf_url: string

    @IsString()
    twilioMessagingSID: string

    @IsEmail()
    @IsString()
    supportEmail: string

    @IsString()
    supportEmailPassword: string

    dbConfig: DatabaseConfig

    async init() {
        this.port = parseInt(process.env.APP_PORT)

        this.autoAttributes = [
            'id',
            'createdAt',
            'updatedAt',
        ]

        this.authIssuer = process.env.AUTH_ISSUER,
        this.authAudience = process.env.AUTH_AUDIENCE,

        this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN,
        this.twilioSID = process.env.TWILIO_SID,
        this.twilioSendFrom = process.env.TWILIO_SEND_FROM,
        this.twilioWebhookURL = process.env.TWILIO_WEBHOOK_URL,
        this.twilio_vcf_url = process.env.TWILIO_VCF_URL,
        this.twilioMessagingSID = process.env.TWILIO_MESSAGING_SID,

        this.dbConfig = new DatabaseConfig
        this.dbConfig.dialect = process.env.DB_DIALECT as Dialect
        this.dbConfig.name = process.env.DB_NAME
        this.dbConfig.host = process.env.DB_HOST
        this.dbConfig.username = process.env.DB_USER
        this.dbConfig.password = process.env.DB_PASSWORD

        this.supportEmail = process.env.SUPPORT_EMAIL
        this.supportEmailPassword = process.env.SUPPORT_EMAIL_PASSWORD

        Object.freeze(this)

        await validateOrReject(this.dbConfig)
        await validateOrReject(this)
    }
}


export default new EnvConfig
