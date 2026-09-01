export type AppError = Error & {
    statusCode: number;
    isAppError: true;
};

const createAppError = (message: string, statusCode: number, name: string): AppError => {
    const error = new Error(message) as AppError;
    error.name = name;
    error.statusCode = statusCode;
    error.isAppError = true;
    Error.captureStackTrace(error, createAppError);
    return error;
};

export const createAuthenticationError = (message: string = 'Invalid credentials') =>
    createAppError(message, 401, 'AuthenticationError');

export const createConflictError = (message: string = 'Resource already exists') =>
    createAppError(message, 409, 'ConflictError');

export const createValidationError = (message: string = 'Validation failed') =>
    createAppError(message, 400, 'ValidationError');

export const createNotFoundError = (message: string = 'Resource not found') =>
    createAppError(message, 404, 'NotFoundError');
