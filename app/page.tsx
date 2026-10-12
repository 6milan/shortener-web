'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Gauge, QrCode, ShieldCheck, Sparkles, Timer, Zap } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/context/auth';

const FEATURES = [
  { icon: Zap, title: 'Instant redirects', text: 'Links resolve from a Redis cache, so visitors are on their way in milliseconds.' },
  { icon: BarChart3, title: 'Real analytics', text: 'Daily clicks, devices, browsers and referrers for every link.' },
  { icon: QrCode, title: 'QR codes built in', text: 'Download a crisp QR code for any link with one click.' },
  { icon: Timer, title: 'Expiry and control', text: 'Set an expiry date or switch a link off at any time, effective immediately.' },
  { icon: ShieldCheck, title: 'Safe by design', text: 'Rate limiting, secure random codes and owner-only analytics.' },
  { icon: Gauge, title: 'Retry-safe', text: 'Idempotent creation means a flaky connection never makes duplicates.' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } } };

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-5">
      <header className="flex items-center justify-between py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
              <Link href="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </nav>
      </header>

      <motion.section variants={container} initial="hidden" animate="show" className="pb-16 pt-14 text-center sm:pt-24">
        <motion.span variants={item} className="badge border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <Sparkles className="h-3.5 w-3.5" /> Short links with real analytics
        </motion.span>
        <motion.h1 variants={item} className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Make every link <span className="gradient-text">short, smart</span> and trackable
        </motion.h1>
        <motion.p variants={item} className="mx-auto mt-5 max-w-xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
          Create branded short links in a click, see who opens them, and share them anywhere with a QR code.
        </motion.p>
        <motion.div variants={item} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={user ? '/dashboard' : '/register'} className="btn-primary px-6 py-3 text-base">
            {user ? 'Open dashboard' : 'Create your first link'} <ArrowRight className="h-4 w-4" />
          </Link>
          {!user && <Link href="/login" className="btn-secondary px-6 py-3 text-base">I have an account</Link>}
        </motion.div>

        <motion.div variants={item} className="mx-auto mt-14 max-w-2xl">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="card p-5 text-left shadow-2xl shadow-violet-500/10"
          >
            <p className="text-xs text-slate-500">https://example.com/blog/2026/how-to-build-a-fast-url-shortener-with-django</p>
            <div className="my-3 flex items-center gap-2 text-violet-500"><ArrowRight className="h-4 w-4" /><span className="text-xs">shortened</span></div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-lg font-semibold">sho.rt/<span className="gradient-text">aB3xY9</span></p>
              <div className="flex gap-4 text-sm text-slate-500">
                <span><b className="text-slate-900 dark:text-white">1,284</b> clicks</span>
                <span><b className="text-slate-900 dark:text-white">68%</b> mobile</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
        className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <motion.div key={title} variants={item} whileHover={{ y: -4 }} className="card p-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-500">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{text}</p>
          </motion.div>
        ))}
      </motion.section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-white/10">
        Snipp · Built with Next.js, Framer Motion and Django REST Framework
      </footer>
    </div>
  );
}
