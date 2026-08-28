import { Suspense } from 'react';
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-gold">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-gradient-to-br from-gold-dark to-gold font-display text-lg font-bold text-black">
            HS
          </div>
          <h1 className="font-display text-xl tracking-wide text-ink">CRM HS PRIME</h1>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
