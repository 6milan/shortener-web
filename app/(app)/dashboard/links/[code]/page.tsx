'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, ExternalLink, Globe, MousePointerClick, Smartphone, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { BarList, ClicksChart } from '@/components/charts';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/context/toast';
import { api, ApiError } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/format';
import type { LinkStats } from '@/lib/types';

const RANGES = [7, 30, 90];
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

export default function LinkStatsPage() {
  const { code } = useParams<{ code: string }>();
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await api.stats(code, days));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else toast.error(err instanceof ApiError ? err.message : 'Could not load statistics.');
    } finally { setLoading(false); }
  }, [code, days, toast]);

  useEffect(() => { load(); }, [load]);

  async function downloadQR() {
    try {
      const blob = await (await fetch(api.qrUrl(code, 20))).blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href; a.download = `qr-${code}.png`; a.click();
      URL.revokeObjectURL(href);
    } catch { toast.error('Download failed.'); }
  }

  if (notFound) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-10 text-center">
        <p className="text-lg font-semibold">Link not found</p>
        <p className="mt-1 text-sm text-slate-500">It may have been deleted, or it belongs to another account.</p>
        <Link href="/dashboard" className="btn-primary mt-5">Back to dashboard</Link>
      </div>
    );
  }

  const topDevice = stats?.devices[0]?.name ?? '-';
  const topReferrer = stats?.referrers[0]?.name ?? '-';

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-500"><ArrowLeft className="h-4 w-4" /> All links</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {stats ? (
            <>
              <div className="flex items-center gap-1">
                <h1 className="truncate font-mono text-2xl font-bold tracking-tight sm:text-3xl"><span className="gradient-text">{stats.short_url.replace(/^https?:\/\//, '')}</span></h1>
                <CopyButton text={stats.short_url} />
              </div>
              <a href={stats.original_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm text-slate-500 hover:text-violet-500">
                <span className="truncate">{stats.original_url}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
              <p className="mt-1 text-xs text-slate-400">Created {formatDate(stats.created_at)}</p>
            </>
          ) : <><Skeleton className="h-9 w-64" /><Skeleton className="mt-2 h-5 w-96 max-w-full" /></>}
        </div>
        <div className="relative flex rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setDays(r)} className={`relative rounded-lg px-3.5 py-1.5 text-xs font-medium ${days === r ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
              {days === r && <motion.span layoutId="range-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-white/10" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{r} days</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="All-time clicks" value={stats?.total_clicks} loading={!stats} icon={<MousePointerClick className="h-[18px] w-[18px]" />} />
        <StatCard label={`Last ${days} days`} value={stats?.clicks_in_period} loading={!stats} icon={<TrendingUp className="h-[18px] w-[18px]" />} />
        <motion.div variants={rise} className="card p-5">
          <div className="flex items-center justify-between"><p className="text-sm text-slate-500">Top device</p><Smartphone className="h-[18px] w-[18px] text-violet-500" /></div>
          <p className="mt-3 truncate text-2xl font-bold capitalize">{topDevice}</p>
        </motion.div>
        <motion.div variants={rise} className="card p-5">
          <div className="flex items-center justify-between"><p className="text-sm text-slate-500">Top source</p><Globe className="h-[18px] w-[18px] text-violet-500" /></div>
          <p className="mt-3 truncate text-2xl font-bold">{topReferrer}</p>
        </motion.div>
      </motion.div>

      <motion.section variants={rise} initial="hidden" animate="show" className="card p-5">
        <h2 className="mb-4 font-semibold">Clicks over time</h2>
        {stats ? <ClicksChart data={stats.clicks_by_day} /> : <Skeleton className="h-64" />}
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-3">
        {[{ title: 'Devices', items: stats?.devices }, { title: 'Browsers', items: stats?.browsers }, { title: 'Referrers', items: stats?.referrers }].map((block, i) => (
          <motion.section key={block.title} variants={rise} initial="hidden" animate="show" transition={{ delay: 0.1 + i * 0.08 }} className="card p-5">
            <h2 className="mb-4 font-semibold">{block.title}</h2>
            {block.items ? <BarList items={block.items} /> : <Skeleton className="h-32" />}
          </motion.section>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Recent clicks</h2>
          {stats && !stats.recent_clicks.length && <p className="py-6 text-center text-sm text-slate-500">No clicks yet. Share your link to get started.</p>}
          <ul className="divide-y divide-slate-200/70 dark:divide-white/10">
            {stats?.recent_clicks.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="capitalize">{c.device_type} <span className="text-slate-400">·</span> {c.browser || 'Unknown'}</span>
                <span className="truncate text-slate-500">{c.referrer || 'Direct'}</span>
                <span className="shrink-0 text-xs text-slate-400" title={formatDate(c.clicked_at, true)}>{timeAgo(c.clicked_at)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card flex flex-col items-center p-5 text-center">
          <h2 className="mb-3 self-start font-semibold">QR code</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={api.qrUrl(code, 8)} alt="QR code" className="h-40 w-40 rounded-xl bg-white p-2 ring-1 ring-slate-200" />
          <Button variant="secondary" className="mt-4" onClick={downloadQR} icon={<Download className="h-4 w-4" />}>Download PNG</Button>
        </section>
      </div>
      {loading && stats && <p className="text-center text-xs text-slate-400">Updating...</p>}
    </div>
  );
}
