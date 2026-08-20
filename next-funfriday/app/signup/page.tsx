import Link from 'next/link';
import SignupForm from '../components/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Create an Account</h2>
          <p className="text-sm text-muted-foreground mt-2">Join the Fun Friday game!</p>
        </div>

        <SignupForm />

        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

