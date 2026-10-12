'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast';
import type { ShortLink } from '@/lib/types';

export function QRModal({ link, onClose }: { link: ShortLink | null; onClose: () => void }) {
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!link) return;
    setBusy(true);
    try {
      const blob = await (await fetch(api.qrUrl(link.short_code, 20))).blob(); // larger image for printing
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href; a.download = `qr-${link.short_code}.png`; a.click();
      URL.revokeObjectURL(href);
    } catch { toast.error('Download failed.'); } finally { setBusy(false); }
  }

  return (
    <Modal open={!!link} onClose={() => { setLoaded(false); onClose(); }} title="QR code" description={link?.short_url}>
      {link && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative grid h-60 w-60 place-items-center rounded-2xl bg-white p-3 shadow-inner ring-1 ring-slate-200">
            {!loaded && <Skeleton className="absolute inset-3" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={api.qrUrl(link.short_code, 10)} alt={`QR code for ${link.short_url}`} onLoad={() => setLoaded(true)} className={`h-full w-full transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          <div className="flex gap-2">
            <Button onClick={download} loading={busy} icon={<Download className="h-4 w-4" />}>Download PNG</Button>
            <span className="btn-secondary !p-0"><CopyButton text={link.short_url} className="!p-2.5" /></span>
          </div>
        </div>
      )}
    </Modal>
  );
}
