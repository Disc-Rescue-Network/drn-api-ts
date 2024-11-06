import { SchemaManager, OpenApiStrategy } from '@techntools/sequelize-to-openapi'

import Inventory from './models/inventory'
import Claim from './models/claim'
import Pickup from './models/pickup'
import Course from '../course/models/course'

import config from '../../config'


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
                'confirmed',
                ...config.autoAttributes
            ],
            associations: false
        }
    )
    CreateClaimSchema.properties['pickup']['additionalProperties'] = false
    CreateClaimSchema.properties['pickup']['properties']['day']['anyOf'] = undefined
    CreateClaimSchema.properties['pickup']['properties']['day']['type'] = 'array'
    CreateClaimSchema.properties['pickup']['properties']['time']['anyOf'] = undefined
    CreateClaimSchema.properties['pickup']['properties']['time']['type'] = 'array'

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
            cancelled: {
                type: 'boolean',
            },
        },
        required: ['pickupId'],
        oneOf: [
            { required: ['scheduledOn'] },
            { required: ['cancelled'] }
        ]
    }

    return {
        CreateInventorySchema,
        UpdateInventorySchema,
        GetInventorySchema,

        GetClaimSchema,
        CreateClaimSchema,
        VerifyPCMSchema,
        VerifyClaimSchema,
        ConfirmPickupSchema,
    }
}
