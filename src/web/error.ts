import { Request, Response, NextFunction } from 'express'

import { FailureResponse } from '../lib/service-response'
import { ERR_CODES } from '../lib/error'


export default function (err: Error, _: Request, res: Response, next: NextFunction) {
    /*
     * If you call next() with an error after you have started writing the
     * response (for example, if you encounter an error while streaming the
     * response to the client), the Express default error handler closes the
     * connection and fails the request.
     *
     * So when you add a custom error handler, you must delegate to the default
     * Express error handler, when the headers have already been sent to the
     * client:
     */
    if (res.headersSent)
        return next(err)

    const status = err.status || 500

    res.status(status).json(
        new FailureResponse(
            err.message,
            ERR_CODES[status]
        )
    )
}
