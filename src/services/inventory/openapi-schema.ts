import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import Inventory from './models/inventory'
import Claim from './models/claim'
import Pickup from './models/pickup'

import Course from '../course/models/course'
import SMSLogs from '../sms/models/sms-logs'

import config from '../../config'

import { PICKUP_PREFERENCE } from './constant'


export default function () {
    const schemaManager = new SchemaManager
    const strategy = new OpenApiStrategy

    const CreateInventorySchema = schemaManager.generate(Inventory, strategy, {
        exclude: [
            'status',
            'dateSold',
            'deleted',
            'orgCode',
            'dateClaimed',
            'dateTexted',
            'claimBy',
            ...config.autoAttributes
        ],
        associations: false
    })

    const UpdateInventorySchema = schemaManager.generate(Inventory, strategy, {
        exclude: [
            'claimBy',
            ...config.autoAttributes
        ],
        associations: false
    })
    UpdateInventorySchema['minProperties'] = 1
    UpdateInventorySchema['required'] = undefined

    const GetInventorySchema = schemaManager.generate(Inventory, strategy, {
        associations: false
    })

    const CreateClaimSchema = schemaManager.generate(Claim, strategy, {
        exclude: [
            'tofAccepted',
            'verified',
            'pcmVerified',
            ...config.autoAttributes
        ],
        associations: false
    })
    CreateClaimSchema['required'] = [
        ...CreateClaimSchema['required'],
        'pickup'
    ]
    CreateClaimSchema['oneOf'] = [
        { required: ['email'] },
        { required: ['phoneNumber'] }
    ]
    CreateClaimSchema['additionalProperties'] = false
    CreateClaimSchema.properties['pickup'] = schemaManager.generate(
        Pickup,
        strategy,
        {
            exclude: [
                'claimId',
                ...config.autoAttributes
            ],
            associations: false
        }
    )
    CreateClaimSchema.properties['pickup']['additionalProperties'] = false
    CreateClaimSchema.properties['pickup']['properties']['preference']['anyOf'] = undefined
    CreateClaimSchema.properties['pickup']['properties']['preference']['type'] = 'array'
    CreateClaimSchema.properties['pickup']['properties']['preference']['items'] = {
        'type': 'string',
        'enum': Object.values(PICKUP_PREFERENCE)
    }

    const GetClaimSchema = schemaManager.generate(Claim, strategy, {
        associations: false
    })

    GetClaimSchema.properties['item'] = GetInventorySchema
    GetClaimSchema.properties['pickup'] = schemaManager.generate(Pickup, strategy, { associations: false })
    GetClaimSchema.properties['pickup'].properties['course'] = schemaManager.generate(Course, strategy, { associations: false })

    const VerifyPCMSchema = {
        type: 'object',
        properties: {
            vid: {
                type: 'integer',
                minimum: 1
            },
            otp: {
                type: 'string',
                pattern: '^\\d{6}$'
            },
            tofAccepted: {
                type: 'boolean'
            }
        }
    }

    const VerifyClaimSchema = {
        type: 'object',
        properties: {
            claimId: {
                type: 'integer',
                minimum: 1
            },
            verified: {
                type: 'boolean',
            },
        },
        required: ['claimId', 'verified']
    }

    const ConfirmPickupSchema = {
        type: 'object',
        properties: {
            pickupId: {
                type: 'integer',
                minimum: 1
            },
            scheduledOn: {
                type: 'string',
                format: 'date-time'
            },
            reScheduledOn: {
                type: 'string',
                format: 'date-time'
            },
        },
        required: ['pickupId'],
        oneOf: [
            { required: ['scheduledOn'] },
            { required: ['reScheduledOn'] }
        ]
    }

    const ResendVerificationParams = [
        {
            in: 'query',
            name: 'claimId',
            schema: {
                type: 'integer'
            },
            required: true
        }
    ]

    const SendSMSSchema = schemaManager.generate(SMSLogs, strategy, {
        exclude: ['recipientPhone', 'sentAt', ...config.autoAttributes],
        associations: false
    })
    SendSMSSchema.properties['initialText'] = {
        type: 'boolean'
    }

    const GetSMSSchema = [
        {
            in: 'query',
            name: 'itemId',
            schema: {
                type: 'integer'
            },
            required: true
        }
    ]

    return {
        CreateInventorySchema,
        UpdateInventorySchema,
        GetInventorySchema,

        GetClaimSchema,
        CreateClaimSchema,
        VerifyPCMSchema,
        VerifyClaimSchema,

        ConfirmPickupSchema,

        ResendVerificationParams,

        SendSMSSchema,
        GetSMSSchema
    }
}
