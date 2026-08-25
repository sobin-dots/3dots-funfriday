'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signupSchema, SignupFormInput } from '@/lib/validations/auth';
import { useSignupMutation } from '@/hooks/queries/useAuthQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function SignupForm() {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormInput>({
        resolver: zodResolver(signupSchema),
    });

    const signupMutation = useSignupMutation();

    const onSubmit = (data: SignupFormInput) => {
        signupMutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label>
                    Name
                </Label>
                <Input
                    {...register('name')}
                    type="text"
                    placeholder="John Doe"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

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
                    Team Name
                </Label>
                <Input
                    {...register('team')}
                    type="text"
                    placeholder="Team Alpha"
                />
                {errors.team && <p className="text-sm text-destructive">{errors.team.message}</p>}
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
                disabled={signupMutation.isPending}
                className="w-full"
            >
                {signupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
            </Button>
        </form>
    );
}
