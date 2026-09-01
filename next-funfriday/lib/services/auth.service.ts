import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';
import { LoginFormInput, SignupFormInput } from '@/lib/validations/auth';
import { createAuthenticationError, createConflictError } from '@/lib/errors';
import { ROLES } from '@/constants';

export const signup = async (payload: SignupFormInput) => {
    const { name, email, password, team } = payload;

    const existingUser = await prisma.member.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw createConflictError('This email is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.member.create({
        data: {
            name,
            email,
            password: hashedPassword,
            team,
            role: ROLES.USER,
        },
    });

    return { success: true, message: 'Account created successfully' };
};

export const login = async (payload: LoginFormInput) => {
    const { email, password } = payload;

    const user = await prisma.member.findUnique({
        where: { email },
    });

    if (!user) {
        throw createAuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw createAuthenticationError('Invalid email or password');
    }

    const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        team: user.team,
    });

    return {
        success: true,
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            team: user.team,
        },
    };
};
