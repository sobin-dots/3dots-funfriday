import { NextResponse } from 'next/server';
import { validateBody } from '@/lib/api-utils';
import { connectionSubmitSchema } from '@/lib/validations/game';
import { submitGroup } from '@/lib/services/connection.service';
import { withUser } from '@/lib/auth/withUser';

export const POST = withUser(async (req, user) => {
    const payload = await validateBody(req, connectionSubmitSchema);
    const response = await submitGroup(user.id, payload);
    return NextResponse.json(response);
});
