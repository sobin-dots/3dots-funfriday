import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest, handleApiError } from '@/lib/api-utils';

type AuthenticatedUser = {
    id: string;
    role: string;
    email: string;
    name: string;
    team: string;
};

type AuthenticatedHandler = (
    req: Request,
    user: AuthenticatedUser
) => Promise<NextResponse>;

/**
 * Higher-Order Function that wraps a route handler with authentication.
 * Extracts and verifies the JWT token automatically, then injects the
 * authenticated user into the handler. Handles auth errors centrally.
 *
 * @example
 * export const POST = withUser(async (req, user) => {
 *   const payload = await validateBody(req, schema);
 *   return NextResponse.json(await myService(user.id, payload));
 * });
 */
export const withUser = (handler: AuthenticatedHandler) => {
    return async (req: Request): Promise<NextResponse> => {
        try {
            const user = getCurrentUserFromRequest(req);
            return await handler(req, user);
        } catch (error) {
            return handleApiError(error);
        }
    };
};
