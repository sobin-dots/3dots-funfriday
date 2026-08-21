import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loginAPI, signupAPI } from '@/lib/api/auth.api';
import { LoginFormInput, SignupFormInput } from '@/lib/validations/auth';

export const useLoginMutation = () => {
    const router = useRouter();

    return useMutation({
        mutationFn: (data: LoginFormInput) => loginAPI(data),
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            toast.success('Login successful!');
            router.push('/dashboard');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
};

export const useSignupMutation = () => {
    const router = useRouter();

    return useMutation({
        mutationFn: (data: SignupFormInput) => signupAPI(data),
        onSuccess: () => {
            toast.success('Account created successfully! Please log in.');
            router.push('/login');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
};
