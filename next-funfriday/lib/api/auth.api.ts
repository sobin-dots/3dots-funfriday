import { LoginFormInput, SignupFormInput } from '@/lib/validations/auth';
import { apiClient } from '@/lib/api-client';

export const loginAPI = async (data: LoginFormInput) => {
    return apiClient.post('/api/auth/login', data);
};

export const signupAPI = async (data: SignupFormInput) => {
    return apiClient.post('/api/auth/signup', data);
};
