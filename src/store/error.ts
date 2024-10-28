import { Request, Response, NextFunction } from 'express'

import { FailureResponse } from '../lib/service-response'
import { ERR_CODES, InternalServerError } from '../lib/error'

import { ApiError } from '../lib/types'


export default function (err: Error, _: Request, res: Response, next: NextFunction) {
    let status = 500

    const errResp: ApiError = {
        message: 'Something went wrong',
        code: ERR_CODES[status]
    }

    if (err.name === 'SequelizeForeignKeyConstraintError')
        errResp.message = 'Foreign key constraint error'
    else if (err.name == 'SequelizeValidationError') {  /* Sequelize model level validations */
        status = 400

        errResp.message = 'Validations failed'
        errResp.code = ERR_CODES[status]
        errResp.details = {
            validations: err['errors'].map((obj: {}) => {
                return {
                    validator: obj['path'],
                    message: obj['message'],
                }
            })
        }
    } else if (err['cause']) {  /* Sequelize field level validations */
        if (err['cause']['name'] === 'SequelizeValidationError') {
            status = 400

            errResp.message = 'Field validations failed'
            errResp.code = ERR_CODES[status]
            errResp.details = {
                fields: err['cause'].errors.map((obj: {}) => {
                    return {
                        field: obj['path'],
                        message: obj['message'],
                        value: obj['value']
                    }
                })
            }
        }
    } else if (err.name == 'SequelizeDatabaseError') {
        return next(new InternalServerError)
    } else
        return next(err)

    res.status(status).json(
        new FailureResponse(
            errResp.message,
            ERR_CODES[status],
            errResp.details,
        )
    )
}
