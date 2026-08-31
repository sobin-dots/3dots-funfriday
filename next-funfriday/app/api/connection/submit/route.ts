import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest, validateBody, handleApiError } from '@/lib/api-utils';
import { connectionSubmitSchema } from '@/lib/validations/game';
import { ConnectionService } from '@/lib/services/connection.service';

export async function POST(req: Request) {
    try {
        const user = getCurrentUserFromRequest(req);
        const payload = await validateBody(req, connectionSubmitSchema);

        const response = await ConnectionService.submitGroup(user.id, payload);

        return NextResponse.json(response);
    } catch (error) {
        return handleApiError(error);
    }
}
