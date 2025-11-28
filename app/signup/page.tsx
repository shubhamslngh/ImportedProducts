'use client';
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/PageWrapper';
import { PageSection } from '@/components/PageSection';
import { useSession } from '@/lib/session-context';
import { useSnackbar } from '@/components/SnackbarProvider';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { setSession, status: sessionStatus } = useSession();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (sessionStatus === 'authenticated' && formStatus !== 'success') {
      router.replace('/');
    }
  }, [sessionStatus, formStatus, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormStatus('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const { data, error } = await response.json();
      if (!response.ok || error) {
        setFormStatus('error');
        const message = error || 'Signup failed.';
        setErrorMessage(message);
        showSnackbar(message, { variant: 'error' });
        return;
      }

      setSession({
        authToken: data.authToken ?? null,
        refreshToken: data.refreshToken ?? null,
        user: data.user ?? { email },
      });
      setFormStatus('success');
      showSnackbar('Account created. Check your inbox to set a password.', { variant: 'success' });
      setTimeout(() => router.push('/'), 1400);
    } catch (error) {
      console.error(error);
      setFormStatus('error');
      const message = 'Unexpected error. Please try again.';
      setErrorMessage(message);
      showSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <main className="flex flex-col gap-8 py-6">
      <PageWrapper>
        <PageSection>
          <div className="mx-auto max-w-md space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Trade account</p>
              <h1 className="text-3xl font-black tracking-[0.3em] text-slate-900">SIGN UP</h1>
              <p className="text-sm text-slate-500">
                Drop your work email. We’ll spin up an account, log you in, and email a secure link to set your password.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                autoComplete="email"
                required
              />
              <button
                type="submit"
                disabled={formStatus === 'loading'}
                className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {formStatus === 'loading' ? 'Provisioning…' : 'Create account'}
              </button>
            </form>
            {errorMessage && <p className="text-center text-sm text-rose-500">{errorMessage}</p>}
            {formStatus === 'success' && (
              <p className="text-center text-sm text-emerald-500">
                Account ready. Check your inbox to set a password.
              </p>
            )}
            <div className="pt-2 text-center text-sm text-slate-500">
              Already registered?{' '}
              <Link href="/login" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
                Go to login
              </Link>
            </div>
          </div>
        </PageSection>
      </PageWrapper>
    </main>
  );
}
