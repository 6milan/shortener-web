'use client';
import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AtSign, Lock, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { GOOGLE_ENABLED, GoogleButton } from '@/components/google-button';
import { useAuth } from '@/context/auth';
import { useToast } from '@/context/toast';
import { ApiError } from '@/lib/api';
import { passwordStrength } from '@/lib/format';

const BAR_COLORS = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];

function RegisterForm() {
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(form.password);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (form.password !== form.password2) local.password2 = 'Passwords do not match.';
    if (Object.keys(local).length) { setErrors(local); return; }
    setErrors({});
    setBusy(true);
    try {
      await register({ ...form, username: form.username.trim(), email: form.email.trim() });
      toast.success('Account created. Welcome!');
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.status === 400 ? err.fieldErrors : { form: err.message });
      else setErrors({ form: 'Unexpected error.' });
    } finally { setBusy(false); }
  }

  return (
    <div className="card p-7 shadow-xl">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Free to start. No credit card.</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Username" autoComplete="username" icon={<UserIcon className="h-4 w-4" />} value={form.username} onChange={set('username')} error={errors.username} autoFocus />
        <Field label="Email" type="email" autoComplete="email" icon={<AtSign className="h-4 w-4" />} value={form.email} onChange={set('email')} error={errors.email} />
        <div>
          <Field label="Password" type="password" autoComplete="new-password" icon={<Lock className="h-4 w-4" />} value={form.password} onChange={set('password')} error={errors.password} />
          {form.password && (
            <div className="mt-2">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <motion.span key={n} className={`h-1.5 flex-1 rounded-full ${n <= strength.score ? BAR_COLORS[strength.score] : 'bg-slate-200 dark:bg-white/10'}`}
                    initial={false} animate={{ scaleY: n <= strength.score ? 1 : 0.7 }} />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">{strength.label}</p>
            </div>
          )}
        </div>
        <Field label="Confirm password" type="password" autoComplete="new-password" icon={<Lock className="h-4 w-4" />} value={form.password2} onChange={set('password2')} error={errors.password2} />
        {errors.form && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{errors.form}</p>}
        <Button type="submit" loading={busy} className="w-full" disabled={!form.username || !form.email || !form.password}>Create account</Button>
      </form>

      {GOOGLE_ENABLED && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />or<span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /></div>
          <GoogleButton
            onToken={async (t) => { try { await loginWithGoogle(t); router.replace('/dashboard'); } catch (err) { toast.error(err instanceof ApiError ? err.message : 'Google sign-in failed.'); } }}
            onError={() => toast.error('Google sign-in failed.')}
          />
        </>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered? <Link href="/login" className="font-medium text-violet-500 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
