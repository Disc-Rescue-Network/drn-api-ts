import * as crypto from 'crypto'


export const generateOTP = function(len=6) {
    const arr = new Uint8Array(1)

    const otp = []
    for (let i = 0; i < len; i++) {
        otp.push(crypto.getRandomValues(arr)[0] % 10)
    }

    return otp.join('')
}
