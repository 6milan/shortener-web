'use client';
import { useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Link2, PartyPopper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { CopyButton } from '@/components/copy-button';
import { api, ApiError } from '@/lib/api';
import { fromLocalInput } from '@/lib/format';
import type { CreateLinkInput, ShortLink } from '@/lib/types';
import { useToast } from '@/context/toast';

export function CreateLinkForm({ onCreated }: { onCreated: (link: ShortLink) => void }) {
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [expires, setExpires] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ link: ShortLink; existing: boolean } | null>(null);

  // One idempotency key per *logical* submission. If the request fails and the user clicks again with
  // the same data, we reuse the key, so the server can never create two links. Changing any field
  // means a new intent, so a new key.
  const attempt = useRef<{ key: string; signature: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    let original = url.trim();
    if (original && !/^[a-z][a-z0-9+.-]*:\/\//i.test(original)) original = `https://${original}`;

    const body: CreateLinkInput = { original_url: original };
    if (title.trim()) body.title = title.trim();
    if (code.trim()) body.custom_code = code.trim();
    if (expires) body.expires_at = fromLocalInput(expires);

    const signature = JSON.stringify(body);
    if (!attempt.current || attempt.current.signature !== signature) {
      attempt.current = { key: crypto.randomUUID(), signature };
    }

    setBusy(true);
    try {
      const { link, existing } = await api.createLink(body, attempt.current.key);
      attempt.current = null;
      setResult({ link, existing });
      setUrl(''); setTitle(''); setCode(''); setExpires('');
      toast.success(existing ? 'You already had a link for this URL.' : 'Short link created!');
      onCreated(link);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const fields = err.fieldErrors;
        setErrors(fields);
        if (fields.custom_code || fields.expires_at || fields.title) setAdvanced(true);
        if (!Object.keys(fields).length) toast.error(err.message);
      } else toast.error(err instanceof ApiError ? err.message : 'Could not create the link.');
    } finally { setBusy(false); }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" /><h2 className="font-semibold">Create a short link</h2></div>
      <form onSubmit={submit} noValidate>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field className="flex-1" aria-label="Destination URL" placeholder="Paste a long URL, e.g. https://example.com/very/long/page"
            icon={<Link2 className="h-4 w-4" />} value={url} onChange={(e) => setUrl(e.target.value)} error={errors.original_url} inputMode="url" />
          <Button type="submit" loading={busy} disabled={!url.trim()} className="sm:h-[42px]">Shorten</Button>
        </div>

        <button type="button" onClick={() => setAdvanced((a) => !a)} className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-violet-500">
          Options <motion.span animate={{ rotate: advanced ? 180 : 0 }}><ChevronDown className="h-3.5 w-3.5" /></motion.span>
        </button>
        <AnimatePresence initial={false}>
          {advanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid gap-3 pt-3 sm:grid-cols-3">
                <Field label="Title" placeholder="Optional" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={200} />
                <Field label="Custom code" placeholder="my-link" value={code} onChange={(e) => setCode(e.target.value)} error={errors.custom_code} maxLength={20} hint="3-20 letters, numbers, - or _" />
                <Field label="Expires" type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} error={errors.expires_at} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 16 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <PartyPopper className="h-5 w-5 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{result.existing ? 'Existing link' : 'Your new link'}</p>
                  <a href={result.link.short_url} target="_blank" rel="noreferrer" className="block truncate font-mono text-sm font-semibold hover:underline">{result.link.short_url}</a>
                </div>
              </div>
              <CopyButton text={result.link.short_url} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
