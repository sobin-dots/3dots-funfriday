import Link from 'next/link';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account to continue</p>
        </div>

        <LoginForm />

        <div className="text-center text-sm">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

