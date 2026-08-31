import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/jwt';
import { AppError, AuthenticationError, ValidationError } from '@/lib/errors';

/**
 * Extracts and verifies the JWT token from the Request's Authorization header.
 * @throws {AuthenticationError} If the token is missing, invalid, or lacks a user ID.
 */
export function getCurrentUserFromRequest(req: Request) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('Missing or invalid authorization header');
    }

    const [, token] = authHeader.split(' ');
    const user = verifyToken(token) as { id: string; role: string; email: string; name: string; team: string } | null;

    if (!user || !user.id) {
        throw new AuthenticationError('Invalid or expired token');
    }

    return user;
}

/**
 * Parses the JSON body from the Request and validates it against a Zod schema.
 * @throws {ValidationError} If the JSON is invalid or fails schema validation.
 */
export async function validateBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<T> {
    let body;
    try {
        body = await req.json();
    } catch (error) {
        throw new ValidationError('Invalid JSON payload');
    }

    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
        const errorMessage = validationResult.error.issues
            .map((issue) => issue.message)
            .join(', ');
        throw new ValidationError(errorMessage);
    }

    return validationResult.data;
}

/**
 * Centralized error handler for API routes. 
 * Formats AppErrors and catches unexpected errors.
 */
export function handleApiError(error: unknown) {
    if (error instanceof AppError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }

    console.error('Unhandled API Error:', error);

    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
    );
}
