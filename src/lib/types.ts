import { Request, Response, NextFunction } from 'express'


export interface RequestHandler {
    (request: Request, response: Response, next: NextFunction): void
}

export type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>

export type AsyncFunction = () => Promise<any>

export type ApiError = {
    message: string,
    code: string
    details?: {
        fields?: {
            field: string,
            message: string,
            value: string | number
        }[],
        validations?: {
            validator: string,
            message: string,
        }[]
    }
}
