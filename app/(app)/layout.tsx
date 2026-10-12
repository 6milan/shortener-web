'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogOut, Menu, Settings, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Route guard: unauthenticated visitors are sent to login and returned afterwards.
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);
  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-8">
        <Skeleton className="h-10 w-48" /><Skeleton className="h-32" /><Skeleton className="h-64" />
      </div>
    );
  }

  const active = (href: string) => (href === '/dashboard' ? pathname === href || pathname.startsWith('/dashboard/links') : pathname.startsWith(href));
  const nav = (
    <nav className="space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active(href) ? 'text-violet-600 dark:text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}`}>
          {active(href) && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <Icon className="relative h-[18px] w-[18px]" /><span className="relative">{label}</span>
        </Link>
      ))}
    </nav>
  );
  const initials = (user.first_name?.[0] ?? user.username[0]).toUpperCase();
  const profile = (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white">{initials}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.username}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
      <button onClick={logout} aria-label="Log out" title="Log out" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"><LogOut className="h-4 w-4" /></button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200/70 p-5 backdrop-blur-xl dark:border-white/10 lg:flex">
        <div className="space-y-8"><Logo href="/dashboard" />{nav}</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-slate-500"><span>Theme</span><ThemeToggle /></div>
          {profile}
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#090a14]/70 lg:hidden">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-1"><ThemeToggle />
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="btn-ghost h-10 w-10 !p-0"><Menu className="h-5 w-5" /></button></div>
        </header>
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <motion.div className="absolute inset-0 bg-slate-950/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <motion.div className="absolute right-0 top-0 flex h-full w-72 flex-col justify-between bg-white p-5 shadow-2xl dark:bg-slate-900"
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 34 }}>
                <div className="space-y-6"><button onClick={() => setOpen(false)} aria-label="Close menu" className="btn-ghost h-9 w-9 !p-0"><X className="h-5 w-5" /></button>{nav}</div>
                {profile}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
