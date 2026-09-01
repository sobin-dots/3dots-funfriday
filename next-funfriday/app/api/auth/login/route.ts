import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { login } from '@/lib/services/auth.service';
import { validateBody, handleApiError } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const payload = await validateBody(req, loginSchema);
    const loginResponse = await login(payload);
    return NextResponse.json(loginResponse);
  } catch (error) {
    return handleApiError(error);
  }
}
