'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/PageWrapper';
import { PageSection } from '@/components/PageSection';
import { useSession } from '@/lib/session-context';
import { useSnackbar } from '@/components/SnackbarProvider';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const { data, error } = await response.json();
      if (!response.ok || error) {
        setFormStatus('error');
        const message = error || 'Login failed';
        setErrorMessage(message);
        showSnackbar(message, { variant: 'error' });
        return;
      }

      setSession({
        authToken: data.authToken ?? null,
        refreshToken: data.refreshToken ?? null,
        user: data.user ?? null,
      });
      setFormStatus('success');
      showSnackbar('Logged in. Redirecting…', { variant: 'success' });
      setTimeout(() => router.push('/'), 1200);
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
          <div className="mx-auto max-w-md rounded-[2rem] border border-slate-900 bg-black p-8 text-white shadow-2xl">
            <div className="mb-6 space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-red-400">Concierge access</p>
              <h1 className="text-3xl font-black tracking-[0.3em]">LOGIN</h1>
              <p className="text-sm text-red-300">Use your Imported Products credentials to access concierge drops.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username or Email"
                className="w-full rounded-lg border border-red-500 bg-black/40 px-4 py-3 text-sm text-white placeholder-red-300 focus:border-white focus:outline-none"
                autoComplete="email"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-red-500 bg-black/40 px-4 py-3 text-sm text-white placeholder-red-300 focus:border-white focus:outline-none"
                autoComplete="current-password"
              />
              <button
                type="submit"
                disabled={formStatus === 'loading'}
                className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-900"
              >
                {formStatus === 'loading' ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            {errorMessage && <p className="mt-4 text-center text-sm text-red-400">{errorMessage}</p>}
            {formStatus === 'success' && <p className="mt-4 text-center text-sm text-emerald-400">Logged in. Redirecting…</p>}
            <div className="mt-6 space-y-2 text-center text-sm">
              <p className="uppercase tracking-[0.4em] text-red-500">or</p>
              <Link href="/signup" className="inline-flex items-center justify-center rounded-lg border border-red-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-300">
                New user
              </Link>
            </div>
          </div>
        </PageSection>
      </PageWrapper>
    </main>
  );
}
