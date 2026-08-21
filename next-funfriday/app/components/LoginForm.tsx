'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, LoginFormInput } from '@/lib/validations/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormInput>({
        resolver: zodResolver(loginSchema),
    });

    const loginMutation = useMutation({
        mutationFn: async (data: LoginFormInput) => {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to login');
            return json;
        },
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            toast.success('Login successful!');
            router.push('/');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const onSubmit = (data: LoginFormInput) => {
        loginMutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label>
                    Email
                </Label>
                <Input
                    {...register('email')}
                    type="email"
                    placeholder="m@example.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>
                    Password
                </Label>
                <div className="relative">
                    <Input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full"
            >
                {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
            </Button>
        </form>
    );
}
