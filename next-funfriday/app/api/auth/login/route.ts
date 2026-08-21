import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { AuthService } from '../auth.service';
import { AppError } from '@/lib/errors';

export async function POST(req: Request) {
  try {
    const requestBody = await req.json();
    const { success: isValidationSuccessful, data: payload, error: validationError } = loginSchema.safeParse(requestBody);

    if (!isValidationSuccessful) {
      return NextResponse.json(
        { error: validationError.errors.map((validationIssue: any) => validationIssue.message).join(', ') },
        { status: 400 }
      );
    }

    const loginResponse = await AuthService.login(payload);
    return NextResponse.json(loginResponse);
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
