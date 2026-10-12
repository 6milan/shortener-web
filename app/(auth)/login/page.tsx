'use client';
import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { GOOGLE_ENABLED, GoogleButton } from '@/components/google-button';
import { useAuth } from '@/context/auth';
import { useToast } from '@/context/toast';
import { ApiError } from '@/lib/api';
import { safeNext } from '@/lib/format';

function LoginForm() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) => setError(e instanceof ApiError ? (e.status === 401 ? 'Wrong username or password.' : e.message) : 'Unexpected error.');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      router.replace(safeNext(params.get('next')));
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  return (
    <div className="card p-7 shadow-xl">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to manage your links.</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Username or email" autoComplete="username" icon={<UserIcon className="h-4 w-4" />}
          value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus required />
        <Field label="Password" type={show ? 'text' : 'password'} autoComplete="current-password" icon={<Lock className="h-4 w-4" />}
          value={password} onChange={(e) => setPassword(e.target.value)} required
          right={<button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="rounded-lg p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
        {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>}
        <Button type="submit" loading={busy} className="w-full" disabled={!identifier || !password}>Sign in</Button>
      </form>

      {GOOGLE_ENABLED && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />or<span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /></div>
          <GoogleButton
            onToken={async (t) => { try { await loginWithGoogle(t); router.replace(safeNext(params.get('next'))); } catch (err) { fail(err); } }}
            onError={() => toast.error('Google sign-in failed.')}
          />
        </>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        New here? <Link href="/register" className="font-medium text-violet-500 hover:underline">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
