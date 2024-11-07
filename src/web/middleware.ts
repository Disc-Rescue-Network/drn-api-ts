import { Request, Response, NextFunction } from 'express'

import { auth } from 'express-oauth2-jwt-bearer'

import config from '../config'

import { Forbidden } from '../lib/error'


/**
 * Middleware that requires a minimal valid auth token
 */
export const requireLogin = auth({
    issuerBaseURL: config.authIssuer,
    audience: config.authAudience,
})

export const extractOrgCode = (req: Request): string | null => {
    const orgCode = req.auth?.payload?.org_code;
    if (typeof orgCode !== 'string')
        return null

    const userOrgCode = orgCode.trim()
    if (!userOrgCode)
        return null

    return userOrgCode
}

/**
 * Middleware placed on routes to enforce user org_code claim
 *
 * @param {Promise<string | null>} getOrgCode function to get the orgCode to compare against
 * @returns
 */
export const requireOrgAuth = (
    getOrgCode: (req: Request, res: Response) => Promise<string | null>
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return async (req, res, next) => {
        if (allowClientCredentialsGrantType(req))
            return next()

        const userOrgCode = extractOrgCode(req)
        if (!userOrgCode)
            return next(new Forbidden('Organization is missing in auth payload'))

        try {
            const recordOrgCode = await getOrgCode(req, res)
            if (userOrgCode !== recordOrgCode)
                return next(new Forbidden('Organization is different'))
        } catch(err) {
            return next(err)
        }

        next()
    }
}

/**
 * Middleware to allow auth tokens authenticated directly with the oauth provider
 * using client_credentials
 *
 * @param {Request} req express request
 * @returns {boolean}
 */
const allowClientCredentialsGrantType = (req: Request): boolean => {
    const grantType = req.auth?.payload?.gty ?? null
    if (!Array.isArray(grantType) || !grantType.includes('client_credentials'))
        return false

    const issuer = req.auth?.payload?.iss ?? null
    if (issuer !== config.authIssuer)
        return false

    return true
}
