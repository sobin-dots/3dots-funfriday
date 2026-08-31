import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validations/auth';
import { AuthService } from '@/lib/services/auth.service';
import { validateBody, handleApiError } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const payload = await validateBody(req, signupSchema);
    const signupResponse = await AuthService.signup(payload);
    return NextResponse.json(signupResponse);
  } catch (error) {
    return handleApiError(error);
  }
}
