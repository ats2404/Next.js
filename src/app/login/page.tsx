import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cyan-300 to-blue-500 p-4">
      <LoginForm />
    </main>
  );
}
