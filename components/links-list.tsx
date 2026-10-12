'use client';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Pencil, Power, QrCode, Trash2, MousePointerClick } from 'lucide-react';
import { CopyButton } from '@/components/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, hostOf } from '@/lib/format';
import type { ShortLink } from '@/lib/types';

interface Props {
  links: ShortLink[];
  loading: boolean;
  onToggle: (l: ShortLink) => void;
  onEdit: (l: ShortLink) => void;
  onDelete: (l: ShortLink) => void;
  onQR: (l: ShortLink) => void;
}

function StatusBadge({ link }: { link: ShortLink }) {
  if (!link.is_active) return <span className="badge bg-slate-500/15 text-slate-500">Disabled</span>;
  if (link.is_expired) return <span className="badge bg-amber-500/15 text-amber-600 dark:text-amber-400">Expired</span>;
  return <span className="badge bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active</span>;
}

const iconBtn = 'rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10';

export function LinksList({ links, loading, onToggle, onEdit, onDelete, onQR }: Props) {
  if (loading && !links.length) {
    return <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[72px]" />)}</div>;
  }
  return (
    <ul className={`divide-y divide-slate-200/70 transition-opacity dark:divide-white/10 ${loading ? 'opacity-60' : ''}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {links.map((link) => (
          <motion.li
            key={link.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <a href={link.short_url} target="_blank" rel="noreferrer" className="font-mono text-sm font-semibold text-violet-600 hover:underline dark:text-violet-300">
                  {link.short_url.replace(/^https?:\/\//, '')}
                </a>
                <CopyButton text={link.short_url} className="!p-1" />
                <StatusBadge link={link} />
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-700 dark:text-slate-300" title={link.original_url}>
                {link.title || hostOf(link.original_url)}
              </p>
              <p className="truncate text-xs text-slate-500" title={link.original_url}>{link.original_url}</p>
              <p className="mt-1 text-xs text-slate-400">
                Created {formatDate(link.created_at)}{link.expires_at && ` · Expires ${formatDate(link.expires_at, true)}`}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-semibold tabular-nums dark:bg-white/5">
                <MousePointerClick className="h-3.5 w-3.5 text-violet-500" />{link.clicks.toLocaleString()}
              </div>
              <div className="flex items-center">
                <Link href={`/dashboard/links/${link.short_code}`} aria-label="Statistics" title="Statistics" className={iconBtn}><BarChart3 className="h-4 w-4" /></Link>
                <button onClick={() => onQR(link)} aria-label="QR code" title="QR code" className={iconBtn}><QrCode className="h-4 w-4" /></button>
                <button onClick={() => onEdit(link)} aria-label="Edit" title="Edit" className={iconBtn}><Pencil className="h-4 w-4" /></button>
                <button onClick={() => onToggle(link)} aria-label={link.is_active ? 'Disable' : 'Enable'} title={link.is_active ? 'Disable' : 'Enable'} className={`${iconBtn} ${link.is_active ? '' : 'text-amber-500'}`}><Power className="h-4 w-4" /></button>
                <button onClick={() => onDelete(link)} aria-label="Delete" title="Delete" className={`${iconBtn} hover:!bg-rose-500/10 hover:text-rose-500`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
