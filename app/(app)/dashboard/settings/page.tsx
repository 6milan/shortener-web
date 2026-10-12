'use client';
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Save, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { useAuth } from '@/context/auth';
import { useToast } from '@/context/toast';
import { api, ApiError } from '@/lib/api';
import { formatDate, passwordStrength } from '@/lib/format';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({ first_name: user?.first_name ?? '', last_name: user?.last_name ?? '', email: user?.email ?? '' });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false);
  const strength = passwordStrength(pw.new_password);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true); setProfileErrors({});
    try {
      setUser(await api.updateMe(profile));
      toast.success('Profile saved');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setProfileErrors(err.fieldErrors);
      else toast.error(err instanceof ApiError ? err.message : 'Could not save.');
    } finally { setSavingProfile(false); }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (pw.new_password !== pw.confirm) { setPwErrors({ confirm: 'Passwords do not match.' }); return; }
    setSavingPw(true); setPwErrors({});
    try {
      await api.changePassword({ old_password: pw.old_password, new_password: pw.new_password });
      setPw({ old_password: '', new_password: '', confirm: '' });
      toast.success('Password updated');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setPwErrors(err.fieldErrors);
      else toast.error(err instanceof ApiError ? err.message : 'Could not change the password.');
    } finally { setSavingPw(false); }
  }

  const card = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-slate-500">Member since {formatDate(user?.date_joined)}</p>
      </div>

      <motion.form {...card} onSubmit={saveProfile} className="card space-y-4 p-6" noValidate>
        <div className="flex items-center gap-2"><UserCog className="h-4 w-4 text-violet-500" /><h2 className="font-semibold">Profile</h2></div>
        <Field label="Username" value={user?.username ?? ''} disabled hint="Usernames cannot be changed." readOnly />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" value={profile.first_name} onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))} error={profileErrors.first_name} />
          <Field label="Last name" value={profile.last_name} onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))} error={profileErrors.last_name} />
        </div>
        <Field label="Email" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} error={profileErrors.email} />
        <div className="flex justify-end"><Button type="submit" loading={savingProfile} icon={<Save className="h-4 w-4" />}>Save profile</Button></div>
      </motion.form>

      <motion.form {...card} transition={{ delay: 0.08 }} onSubmit={savePassword} className="card space-y-4 p-6" noValidate>
        <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-violet-500" /><h2 className="font-semibold">Change password</h2></div>
        <Field label="Current password" type="password" autoComplete="current-password" value={pw.old_password} onChange={(e) => setPw((p) => ({ ...p, old_password: e.target.value }))} error={pwErrors.old_password} />
        <Field label="New password" type="password" autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))} error={pwErrors.new_password}
          hint={pw.new_password ? `Strength: ${strength.label}` : 'At least 8 characters, not too common.'} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} error={pwErrors.confirm} />
        <div className="flex justify-end"><Button type="submit" loading={savingPw} disabled={!pw.old_password || !pw.new_password}>Update password</Button></div>
        <p className="text-xs text-slate-500">Accounts created with Google have no password to change.</p>
      </motion.form>
    </div>
  );
}
