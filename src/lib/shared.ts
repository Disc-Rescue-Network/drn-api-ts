import * as crypto from 'crypto'
import * as jwt from 'jsonwebtoken'

import envConfig from '../config'


export const generateOTP = function(len=6) {
    const arr = new Uint8Array(1)

    const otp = []
    for (let i = 0; i < len; i++) {
        otp.push(crypto.getRandomValues(arr)[0] % 10)
    }

    return otp.join('')
}


export function generateToken(data: any) {
    return jwt.sign(data, envConfig.jwtSecret, { expiresIn: envConfig.jwtExpiry })
}

export function verifyToken(token: string) {
    return jwt.verify(token, envConfig.jwtSecret)
}
