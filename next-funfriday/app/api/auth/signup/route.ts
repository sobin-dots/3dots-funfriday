import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validations/auth';
import { AuthService } from '../auth.service';
import { AppError } from '@/lib/errors';

export async function POST(req: Request) {
  try {
    const requestBody = await req.json();
    const { success: isValidationSuccessful, data: payload, error: validationError } = signupSchema.safeParse(requestBody);

    if (!isValidationSuccessful) {
      return NextResponse.json(
        { error: validationError.errors.map((validationIssue: any) => validationIssue.message).join(', ') },
        { status: 400 }
      );
    }

    const signupResponse = await AuthService.signup(payload);
    return NextResponse.json(signupResponse);
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
