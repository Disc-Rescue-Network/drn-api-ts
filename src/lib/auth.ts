import jwt, { JwtHeader, SigningKeyCallback, JwtPayload } from 'jsonwebtoken'
import jwksClient, { SigningKey } from 'jwks-rsa'

import config from '../config'

const JWKS_ENDPOINT = `${config.authIssuer}/.well-known/jwks`

const client = jwksClient({
    jwksUri: JWKS_ENDPOINT
})

function getKey(header: JwtHeader, callback: SigningKeyCallback) {
    client.getSigningKey(header.kid, (err, key: SigningKey) => {
        if (err) {
            console.log(err)
            return callback(err)
        }

        const signingKey = key.getPublicKey()
        callback(null, signingKey)
    })
}

export const decodeToken = async (token: string): Promise<string | JwtPayload> => {
    return new Promise((res, rej) => {
        jwt.verify(
            token,
            getKey,
            {
                audience: config.authAudience,
                issuer: config.authIssuer,
                algorithms: ['RS256']
            },
            (err, decoded) => {
                if (err) {
                    console.error('Token verification failed:', err.message)
                    rej(err)
                } else {
                    res(decoded)
                }
            }
        )
    })
}
