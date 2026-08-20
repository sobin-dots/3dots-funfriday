import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';
import { LoginForm, SignupForm } from '@/lib/validations/auth';
import { AuthenticationError, ConflictError } from '@/lib/errors';

export class AuthService {
    static async signup(data: SignupForm) {
        const { name, email, password, team } = data;

        const existingUser = await prisma.member.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictError('This email is already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.member.create({
            data: {
                name,
                email,
                password: hashedPassword,
                team,
                role: 'USER',
            },
        });

        return { success: true, message: 'Account created successfully' };
    }

    static async login(data: LoginForm) {
        const { email, password } = data;

        const user = await prisma.member.findUnique({
            where: { email },
        });

        if (!user) {
            throw new AuthenticationError('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid email or password');
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
    }
}
