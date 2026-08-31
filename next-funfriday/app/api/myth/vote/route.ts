import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest, validateBody, handleApiError } from '@/lib/api-utils';
import { mythVoteSchema } from '@/lib/validations/game';
import { MythService } from '@/lib/services/myth.service';

export async function POST(req: Request) {
    try {
        const user = getCurrentUserFromRequest(req);
        const payload = await validateBody(req, mythVoteSchema);

        const response = await MythService.submitVote(user.id, payload);

        return NextResponse.json(response);
    } catch (error) {
        return handleApiError(error);
    }
}
