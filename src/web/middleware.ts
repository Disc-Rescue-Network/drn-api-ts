import { auth } from 'express-oauth2-jwt-bearer'

import config from '../config'


/**
 * Middleware that requires a minimal valid auth token
 */
export const requireLogin = auth({
  issuerBaseURL: config.authIssuer,
  audience: config.authAudience,
});

/**
 * Handle extracting the org_code from the request auth jwt claims
 * if not found or invalid sends an error to the client and returns null
 * else returns the users org_code
 *
 * @param {Request} req express request
 * @param {Response} res express response
 * @returns {string | null} `string` if userCode is in auth claim | `null` if not valid and error response sent
 */
export const handleOrgCode = (req, res): string | null => {
  const userOrgCodeRaw = req.auth?.payload?.org_code;
  if (typeof userOrgCodeRaw !== "string" || !userOrgCodeRaw) {
    res.status(400).send({
      errors: [{ code: "no_org_code", message: "no org in auth" }],
    });
    return null;
  }
  const userOrgCode = userOrgCodeRaw.trim();
  if (!userOrgCode) {
    res.status(400).send({
      errors: [{ code: "no_org_code", message: "no org in auth" }],
    });
    return null;
  }
  return userOrgCode;
};

/**
 * middleware placed on routes to enforce user org_code claim
 *
 * @param {Promise<string | null>} getOrgCode function to get the orgCode to compare against
 * @returns
 */
export const requireOrgAuth = (
  getOrgCode: (request, response) => Promise<string | null>
): ((req: any, res: any, next: any) => Promise<void>) => {
  return async (req, res, next) => {
    if (allowClientCredentialsGrantType(req)) {
      next();
      return;
    }
    const userOrgCode = handleOrgCode(req, res);
    if (userOrgCode === null) {
      return;
    }
    const recordOrgCode = await getOrgCode(req, res);
    if (userOrgCode === recordOrgCode) {
      next();
    } else {
      res.status(403).send({
        errors: [{ code: "403", message: "unauthorized" }],
      });
    }
  };
};

/**
 * Middleware to allow auth tokens authenticated directly with the oauth provider
 * using client_credentials
 *
 * @param {Request} req express request
 * @returns {boolean}
 */
const allowClientCredentialsGrantType = (req): boolean => {
  const grantType = req.auth?.payload?.gty ?? null;
  if (!Array.isArray(grantType) || !grantType.includes("client_credentials")) {
    return false;
  }
  const issuer = req.auth?.payload?.iss ?? null;
  if (issuer !== config.authIssuer) {
    return false;
  }
  return true;
};
