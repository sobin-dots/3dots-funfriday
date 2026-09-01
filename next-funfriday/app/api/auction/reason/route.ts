import { NextResponse } from 'next/server';
import { validateBody } from '@/lib/api-utils';
import { auctionReasonSchema } from '@/lib/validations/game';
import { submitReason } from '@/lib/services/auction.service';
import { withUser } from '@/lib/auth/withUser';

export const POST = withUser(async (req, user) => {
    const payload = await validateBody(req, auctionReasonSchema);
    const response = await submitReason(user.id, payload);
    return NextResponse.json(response);
});
