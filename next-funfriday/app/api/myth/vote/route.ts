import { NextResponse } from 'next/server';
import { validateBody } from '@/lib/api-utils';
import { mythVoteSchema } from '@/lib/validations/game';
import { submitVote } from '@/lib/services/myth.service';
import { withUser } from '@/lib/auth/withUser';

export const POST = withUser(async (req, user) => {
    const payload = await validateBody(req, mythVoteSchema);
    const response = await submitVote(user.id, payload);
    return NextResponse.json(response);
});
