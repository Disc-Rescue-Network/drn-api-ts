export const ERR_CODES: Record<number, string> = {
  500: 'INTERNAL_SERVER_ERROR',

  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'EXISTS',
};

export class BaseError extends Error {
    constructor(message: string, status: number, code?: string) {
        super(message)
        this.status = status
        this.code = code || ERR_CODES[status]
    }
}

export class InternalServerError extends BaseError {
    constructor(message: string = 'Internal Server Error') {
        super(message, 500)
    }
}

export class BadRequest extends BaseError {
    constructor(message: string = 'Bad Request') {
        super(message, 400)
    }
}

export class ConflictError extends BaseError {
    constructor(message: string = 'Conflict') {
        super(message, 409)
    }
}

export class NotFound extends BaseError {
    constructor(message: string = 'Not Found') {
        super(message, 404)
    }
}

export class Forbidden extends BaseError {
    constructor(message: string = 'Forbidden', code?: string) {
        super(message, 403, code)
    }
}
