export class AppError extends Error {
    constructor(public message: string, public statusCode: number = 500) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Invalid credentials') {
        super(message, 401);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409);
    }
}
