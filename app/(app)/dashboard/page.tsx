'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Link2, MousePointerClick, Power, Search, TrendingUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StatCard } from '@/components/stat-card';
import { CreateLinkForm } from '@/components/create-link-form';
import { LinksList } from '@/components/links-list';
import { QRModal } from '@/components/qr-modal';
import { EditLinkModal } from '@/components/edit-link-modal';
import { useAuth } from '@/context/auth';
import { useToast } from '@/context/toast';
import { api, ApiError } from '@/lib/api';
import { useDebounce } from '@/lib/hooks';
import type { ListParams, Paginated, ShortLink, Summary } from '@/lib/types';

type Filter = 'all' | 'active' | 'disabled' | 'expired';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'disabled', label: 'Disabled' }, { id: 'expired', label: 'Expired' },
];
const ORDERINGS = [
  { value: '-created_at', label: 'Newest first' }, { value: 'created_at', label: 'Oldest first' },
  { value: '-clicks', label: 'Most clicks' }, { value: 'clicks', label: 'Fewest clicks' },
];

// Map the UI filter to the API's query parameters (see ShortenedURLFilter in Part 1).
function filterParams(filter: Filter): Pick<ListParams, 'is_active' | 'expired'> {
  switch (filter) {
    case 'active': return { is_active: true, expired: false };
    case 'disabled': return { is_active: false };
    case 'expired': return { expired: true };
    default: return {};
  }
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [filter, setFilter] = useState<Filter>('all');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState<Paginated<ShortLink> | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [qr, setQr] = useState<ShortLink | null>(null);
  const [editing, setEditing] = useState<ShortLink | null>(null);
  const [deleting, setDeleting] = useState<ShortLink | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Ignore responses that arrive after a newer request was started (fast typing, quick paging).
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await api.listLinks({ search: debouncedSearch, ordering, page, page_size: pageSize, ...filterParams(filter) });
      if (id === requestId.current) setData(res);
    } catch (err) {
      if (id !== requestId.current) return;
      if (err instanceof ApiError && err.status === 404 && page > 1) setPage((p) => p - 1); // page vanished after deletes
      else toast.error(err instanceof ApiError ? err.message : 'Could not load links.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [debouncedSearch, ordering, page, pageSize, filter, toast]);

  const loadSummary = useCallback(async () => {
    try { setSummary(await api.summary()); } catch { /* cards simply keep their last values */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  const refresh = () => { load(); loadSummary(); };

  function onCreated() {
    // Jump to the first page of the default view so the new link is visible.
    setSearch(''); setFilter('all'); setOrdering('-created_at');
    if (page === 1) refresh(); else setPage(1);
    loadSummary();
  }

  // Optimistic toggle: flip the row immediately and roll back if the API refuses.
  async function toggle(link: ShortLink) {
    const next = !link.is_active;
    const patch = (value: boolean) => setData((d) => d && { ...d, results: d.results.map((l) => (l.id === link.id ? { ...l, is_active: value } : l)) });
    patch(next);
    try {
      await api.updateLink(link.short_code, { is_active: next });
      toast.success(next ? 'Link enabled' : 'Link disabled');
      loadSummary();
    } catch (err) {
      patch(link.is_active);
      toast.error(err instanceof ApiError ? err.message : 'Could not update the link.');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.deleteLink(deleting.short_code);
      toast.success('Link deleted');
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete the link.');
    } finally { setDeleteBusy(false); }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1;
  const hasFilters = !!debouncedSearch || filter !== 'all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hi, {user?.first_name || user?.username} <span className="inline-block origin-[70%_70%] animate-pulse">👋</span></h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Here is how your links are doing.</p>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total links" value={summary?.total_links} loading={!summary} icon={<Link2 className="h-[18px] w-[18px]" />} />
        <StatCard label="Active links" value={summary?.active_links} loading={!summary} icon={<Power className="h-[18px] w-[18px]" />} />
        <StatCard label="Total clicks" value={summary?.total_clicks} loading={!summary} icon={<MousePointerClick className="h-[18px] w-[18px]" />} />
        <StatCard label="Clicks, last 7 days" value={summary?.clicks_last_7_days} loading={!summary} icon={<TrendingUp className="h-[18px] w-[18px]" />} />
      </motion.div>

      <CreateLinkForm onCreated={onCreated} />

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 p-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search links, codes, titles" aria-label="Search links" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex rounded-xl bg-slate-100 p-1 dark:bg-white/5">
              {FILTERS.map((f) => (
                <button key={f.id} onClick={() => { setFilter(f.id); setPage(1); }}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === f.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                  {filter === f.id && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-white/10" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  <span className="relative">{f.label}</span>
                </button>
              ))}
            </div>
            <select aria-label="Sort links" className="input !w-auto !py-2 text-xs" value={ordering} onChange={(e) => { setOrdering(e.target.value); setPage(1); }}>
              {ORDERINGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {data && !data.results.length && !loading ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-500"><Link2 className="h-6 w-6" /></span>
            <p className="font-medium">{hasFilters ? 'No links match your search' : 'No links yet'}</p>
            <p className="max-w-xs text-sm text-slate-500">{hasFilters ? 'Try a different search or filter.' : 'Paste a URL above to create your first short link.'}</p>
            {hasFilters && <Button variant="secondary" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</Button>}
          </div>
        ) : (
          <LinksList links={data?.results ?? []} loading={loading} onToggle={toggle} onEdit={setEditing} onDelete={setDeleting} onQR={setQr} />
        )}

        {data && data.count > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 px-4 py-3 text-sm dark:border-white/10">
            <p className="text-slate-500">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.count)} of {data.count.toLocaleString()}</p>
            <div className="flex items-center gap-2">
              <select aria-label="Rows per page" className="input !w-auto !py-1.5 text-xs" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
              <Button variant="secondary" className="!p-2" disabled={!data.previous} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="min-w-14 text-center tabular-nums text-slate-500">{page} / {totalPages}</span>
              <Button variant="secondary" className="!p-2" disabled={!data.next} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </section>

      <QRModal link={qr} onClose={() => setQr(null)} />
      <EditLinkModal link={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete this link?"
        description="The short URL will stop working immediately and its click history is deleted. This cannot be undone.">
        <p className="truncate rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs dark:bg-white/5">{deleting?.short_url}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteBusy} icon={<Trash2 className="h-4 w-4" />} onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
      <AnimatePresence />
    </div>
  );
}
