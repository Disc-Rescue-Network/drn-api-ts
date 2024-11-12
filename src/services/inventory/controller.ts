import { Request, Response } from 'express'

import { plainToClass } from 'class-transformer'

import AppController from '../../lib/app-controller'
import oapi, { oapiPathDef, paginatedResponse } from '../../lib/openapi'
import { PageOptions } from '../../lib/pagination'
import { NotFound } from '../../lib/error'

import inventoryService from './service'
import generate from './openapi-schema'

import smslib from '../sms/lib'
import { sendSms } from '../sms/twilio.service'
import { formatClaimInventoryMessage, optInMessage } from '../sms/sms.model'

import { requireLogin, requireOrgAuth } from '../../web/middleware'


export class InventoryController extends AppController {
    public service = inventoryService

    init () {
        const schemas = generate()

        const CreateInventorySchema = schemas.CreateInventorySchema
        const UpdateInventorySchema = schemas.UpdateInventorySchema
        const GetInventorySchema = schemas.GetInventorySchema

        this.basePath = '/inventory'

        inventoryService.init()

        this.router.patch(
            '/:itemId',
            oapi.validPath(oapiPathDef({
                requestBodySchema: UpdateInventorySchema,
                summary: 'Update Inventory'
            })),
            requireLogin,
            requireOrgAuth(async (req) => {
                const item = await this.service.findById(parseInt(req.params.itemId))
                if (item)
                    return item.orgCode

                throw new NotFound('No such item in inventory')
            }),
            this.update
        )

        this.router.post(
            '',
            oapi.validPath(oapiPathDef({
                requestBodySchema: CreateInventorySchema,
                summary: 'Create Inventory'
            })),
            requireLogin,
            this.create
        )

        this.router.get(
            '',
            oapi.validPath(oapiPathDef({
                responseData: paginatedResponse(GetInventorySchema),
                summary: 'Get Inventory'
            })),
            this.findAll
        )

        this.router.get(
            '/claim',
            oapi.validPath(oapiPathDef({
                responseData: paginatedResponse(schemas.GetClaimSchema),
                summary: 'Get Claims'
            })),
            requireLogin,
            this.findAllClaims
        )

        this.router.post(
            '/claim',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.CreateClaimSchema,
                summary: 'Create Claim'
            })),
            this.claimItem
        )

        this.router.post(
            '/pcm/verify',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.VerifyPCMSchema,
                summary: 'Verify PCM'
            })),
            this.verifyPCM
        )

        this.router.put(
            '/claim/verify',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.VerifyClaimSchema,
                summary: 'Verify Claim'
            })),
            requireLogin,
            requireOrgAuth(async (req) => {
                const claim = await this.service.findClaimById(req.body.claimId)
                if (claim)
                    return claim.item.orgCode

                throw new NotFound('No such claim')
            }),
            this.verifyClaim
        )

        this.router.patch(
            '/claim/pickup',
            oapi.validPath(oapiPathDef({
                requestBodySchema: schemas.ConfirmPickupSchema,
                summary: 'Confirm Schema'
            })),
            requireLogin,
            requireOrgAuth(async (req) => {
                const pickup = await this.service.findPickupById(req.body.pickupId)
                if (pickup)
                    return pickup.course.orgCode

                throw new NotFound('No such pickup')
            }),
            this.confirmPickup
        )

        this.router.patch(
            '/pickup/:id',
            oapi.validPath(oapiPathDef({
                summary: 'Complete Pickup'
            })),
            requireLogin,
            requireOrgAuth(async (req) => {
                const pickup = await this.service.findPickupById(parseInt(req.params.id))
                if (pickup)
                    return pickup.course.orgCode

                throw new NotFound('No such pickup')
            }),
            this.completePickup
        )

        this.router.patch(
            '/claim/:id/surrender',
            oapi.validPath(oapiPathDef({
                summary: 'Surrender Disc'
            })),
            this.surrenderDisc
        )

        this.router.get(
            '/activity',
            oapi.validPath(oapiPathDef({
                summary: 'Get Activities'
            })),
            requireLogin,
            this.findActivities
        )

        return this
    }

    findAll = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.findAll(
                plainToClass(PageOptions, req.query),
                req.query.q as string,
                req.query.orgCode as string
            )
        }
    )

    findById = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.findById(parseInt(req.params.itemId))
        }
    )

    create = AppController.asyncHandler(
        async (req: Request) => {
            const body = req.body

            if (body.textImmediately) {
                const unclaimedData = await inventoryService.getUnclaimedInventory(
                    body.phoneNumber
                )

                const optInStatus = await smslib.getOptInStatus(body.phoneNumber)

                let setDateTexted = false
                if (optInStatus === null) {
                    // request opt in
                    const smsResponse = await sendSms(
                        body.phoneNumber,
                        optInMessage
                    )
                    setDateTexted = !smsResponse === true
                } else if (optInStatus.smsConsent) {
                    // user is opted in, send text
                    const smsResponse = await sendSms(
                        body.phoneNumber,
                        formatClaimInventoryMessage(unclaimedData.length)
                    )
                    setDateTexted = !smsResponse === true
                } else {
                    // phone is opted out
                    setDateTexted = true
                }

                if (setDateTexted) {
                    body.dateTexted = new Date(new Date().toISOString().split("T")[0])
                }
            }

            return inventoryService.create(
                body,
                req.auth.payload.org_code as string,
                req.auth.payload.sub,
            )
        }
    )

    update = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.update(
                parseInt(req.params.itemId),
                req.body,
                req.auth.payload.org_code as string,
                req.auth.payload.sub,
            )
        }
    )

    verifyPCM = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.verifyPCM(req.body)
        }
    )

    findAllClaims = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.findAllClaims(
                plainToClass(PageOptions, req.query),
                req.query.q as string,
            )
        }
    )

    claimItem = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.claimItem(req.body)
        }
    )

    verifyClaim = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.verifyClaim(req.body)
        }
    )

    confirmPickup = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.confirmPickup(
                req.body,
                req.auth.payload.sub,
            )
        }
    )

    completePickup = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.completePickup(
                parseInt(req.params.id),
                req.auth.payload.sub,
            )
        }
    )

    /*
     * API for claimer to surrender the disc in inventory
     */
    surrenderDisc = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.surrenderDisc(parseInt(req.params.id))
        }
    )

    findActivities = AppController.asyncHandler(
        async (req: Request) => {
            return inventoryService.findActivities(
                plainToClass(PageOptions, req.query),
                req.auth.payload.org_code as string
            )
        }
    )
}


export default new InventoryController
