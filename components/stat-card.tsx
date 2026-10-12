'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCard({ label, value, icon, loading }: { label: string; value?: number; icon: ReactNode; loading?: boolean }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -3 }} className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-violet-500">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">
        {loading || value === undefined ? <Skeleton className="h-9 w-20" /> : <AnimatedNumber value={value} />}
      </p>
    </motion.div>
  );
}
