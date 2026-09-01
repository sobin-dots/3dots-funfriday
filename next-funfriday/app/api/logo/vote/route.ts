import { NextResponse } from 'next/server';
import { validateBody } from '@/lib/api-utils';
import { logoVoteSchema } from '@/lib/validations/game';
import { submitGuess } from '@/lib/services/logo.service';
import { withUser } from '@/lib/auth/withUser';

export const POST = withUser(async (req, user) => {
    const payload = await validateBody(req, logoVoteSchema);
    const response = await submitGuess(user.id, payload);
    return NextResponse.json(response);
});
