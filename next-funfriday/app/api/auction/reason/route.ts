import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest, validateBody, handleApiError } from '@/lib/api-utils';
import { auctionReasonSchema } from '@/lib/validations/game';
import { AuctionService } from '@/lib/services/auction.service';

export async function POST(req: Request) {
    try {
        const user = getCurrentUserFromRequest(req);
        const payload = await validateBody(req, auctionReasonSchema);

        const response = await AuctionService.submitReason(user.id, payload);

        return NextResponse.json(response);
    } catch (error) {
        return handleApiError(error);
    }
}
