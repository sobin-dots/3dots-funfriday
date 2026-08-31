import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest, validateBody, handleApiError } from '@/lib/api-utils';
import { logoVoteSchema } from '@/lib/validations/game';
import { LogoService } from '@/lib/services/logo.service';

export async function POST(req: Request) {
    try {
        const user = getCurrentUserFromRequest(req);
        const payload = await validateBody(req, logoVoteSchema);

        const response = await LogoService.submitGuess(user.id, payload);

        return NextResponse.json(response);
    } catch (error) {
        return handleApiError(error);
    }
}
