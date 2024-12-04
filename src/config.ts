import { Dialect } from 'sequelize'

import { IsUrl, ArrayNotEmpty, validateOrReject, IsArray, IsInt, IsString, IsEmail } from 'class-validator'


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


export class GoogleConfig {
    @IsString()
    type: string

    @IsString()
    project_id: string

    @IsString()
    private_key_id: string

    @IsString()
    private_key: string

    @IsString()
    client_email: string

    @IsString()
    client_id: string

    @IsString()
    auth_uri: string

    @IsString()
    token_uri: string

    @IsString()
    auth_provider_x509_cert_url: string

    @IsString()
    client_x509_cert_url: string

    @IsString()
    universe_domain: string
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

    @IsString()
    supportName: string

    @IsEmail()
    @IsString()
    supportEmail: string

    @IsString()
    supportEmailPassword: string

    @IsString()
    redisUri: string

    @IsInt()
    redisExpiry: number

    @IsString()
    serviceName: string

    @ArrayNotEmpty()
    allowedHosts: string[]

    @IsString()
    jwtSecret: string

    @IsString()
    jwtExpiry: string

    @IsString()
    drnAdminsOrgCode: string

    @IsString()
    drnOpenTicket: string

    @IsString()
    drnApp: string

    @IsUrl()
    drnLogo: string

    @IsInt()
    defaultPage: number = 1

    @IsInt()
    defaultPageSize: number = 10

    dbConfig: DatabaseConfig

    googleConfig: GoogleConfig

    async init() {
        this.port = parseInt(process.env.PORT)

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

        this.supportName = process.env.SUPPORT_NAME
        this.supportEmail = process.env.SUPPORT_EMAIL
        this.supportEmailPassword = process.env.SUPPORT_EMAIL_PASSWORD

        this.redisUri = process.env.REDIS_URI
        this.redisExpiry = parseInt(process.env.REDIS_EXPIRY)

        this.jwtSecret = process.env.JWT_SECRET
        this.jwtExpiry = process.env.JWT_EXPIRY

        this.serviceName = process.env.SERVICE_NAME

        this.drnAdminsOrgCode = process.env.DRN_ADMINS_ORG_CODE
        this.drnOpenTicket = process.env.DRN_OPEN_TICKET
        this.drnApp = process.env.DRN_APP
        this.drnLogo = process.env.DRN_LOGO

        this.allowedHosts = process.env.ALLOWED_HOSTS?.split(',')

        this.dbConfig = new DatabaseConfig
        this.dbConfig.dialect = process.env.DB_DIALECT as Dialect
        this.dbConfig.name = process.env.DB_NAME
        this.dbConfig.host = process.env.DB_HOST
        this.dbConfig.username = process.env.DB_USER
        this.dbConfig.password = process.env.DB_PASSWORD

        this.googleConfig = new GoogleConfig
        this.googleConfig.type = process.env.GOOGLE_AI_ACCOUNT_TYPE
        this.googleConfig.project_id = process.env.GOOGLE_AI_PROJECT_ID
        this.googleConfig.private_key_id = process.env.GOOGLE_AI_PRIVATE_KEY_ID
        this.googleConfig.private_key = process.env.GOOGLE_AI_PRIVATE_KEY
        this.googleConfig.client_email = process.env.GOOGLE_AI_CLIENT_EMAIL
        this.googleConfig.client_id = process.env.GOOGLE_AI_CLIENT_ID
        this.googleConfig.auth_uri = process.env.GOOGLE_AI_AUTH_URI
        this.googleConfig.token_uri = process.env.GOOGLE_AI_TOKEN_URI
        this.googleConfig.auth_provider_x509_cert_url = process.env.GOOGLE_AI_AUTH_PROVIDER_X509_CERT_URL
        this.googleConfig.client_x509_cert_url = process.env.GOOGLE_AI_CLIENT_X509_CERT_URL
        this.googleConfig.universe_domain = process.env.GOOGLE_AI_UNIVERSE_DOMAIN

        Object.freeze(this)

        await validateOrReject(this.dbConfig)
        await validateOrReject(this.googleConfig)

        await validateOrReject(this)
    }
}


export default new EnvConfig
