import { Router, Request, Response, NextFunction } from 'express'

import { AsyncRequestHandler } from '../lib/types'


export default class AppController {
    public basePath: string

    public router: Router = Router()

    static asyncMiddleware = (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
        return fn(req, res, next).catch(next)
    }

    static asyncHandler = (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
        res.success(fn(req, res, next), next)
    }
}
