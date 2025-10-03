import { SignupForm } from '@/components/signup-form';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cyan-300 to-blue-500 p-4">
      <SignupForm />
    </main>
  );
}
