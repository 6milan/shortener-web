'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { fromLocalInput, toLocalInput } from '@/lib/format';
import { useToast } from '@/context/toast';
import type { ShortLink } from '@/lib/types';

export function EditLinkModal({ link, onClose, onSaved }: { link: ShortLink | null; onClose: () => void; onSaved: (l: ShortLink) => void }) {
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [expires, setExpires] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (link) { setUrl(link.original_url); setTitle(link.title); setExpires(toLocalInput(link.expires_at)); setActive(link.is_active); setErrors({}); }
  }, [link]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!link) return;
    setBusy(true); setErrors({});
    try {
      const saved = await api.updateLink(link.short_code, { original_url: url.trim(), title: title.trim(), is_active: active, expires_at: fromLocalInput(expires) });
      toast.success('Link updated');
      onSaved(saved); onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setErrors(err.fieldErrors);
      else toast.error(err instanceof ApiError ? err.message : 'Could not save.');
    } finally { setBusy(false); }
  }

  return (
    <Modal open={!!link} onClose={onClose} title="Edit link" description={link ? `The short code ${link.short_code} never changes.` : undefined} width="max-w-lg">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Destination URL" value={url} onChange={(e) => setUrl(e.target.value)} error={errors.original_url} />
        <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={200} />
        <Field label="Expires" type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} error={errors.expires_at} hint="Leave empty for a link that never expires." />
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <span><span className="block text-sm font-medium">Link is active</span><span className="text-xs text-slate-500">Disabled links answer 410 Gone.</span></span>
          <button type="button" role="switch" aria-checked={active} onClick={() => setActive((a) => !a)} className={`relative h-6 w-11 rounded-full transition ${active ? 'bg-violet-500' : 'bg-slate-300 dark:bg-white/20'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${active ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
