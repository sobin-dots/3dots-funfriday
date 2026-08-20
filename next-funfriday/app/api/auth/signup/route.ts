import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validations/auth';
import { AuthService } from '../auth.service';
import { AppError } from '@/lib/errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { success, data: reqData, error } = signupSchema.safeParse(body);

    if (!success) {
      return NextResponse.json(
        { error: error.errors.map((e: any) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const response = await AuthService.signup(reqData);
    return NextResponse.json(response);
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
