import express, { NextFunction } from 'express'

import { ResponseData } from '../../lib/server-response'


declare global {
    namespace Express {
        export interface Request {
            auth?: { payload?: { org_code?: string } }
        }

        export interface Response {
            success: (body?: ResponseData, next: NextFunction, status: number = 200) => void
        }
    }

    interface Error {
        message: string
        status?: number
        code?: string
        validationErrors?: {}[],
        validationSchema: {}
    }
}

export {}
