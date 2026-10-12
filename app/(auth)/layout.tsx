'use client';
import { Suspense, useEffect, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/context/auth';
import { safeNext } from '@/lib/format';

// Reads ?next= and redirects signed-in users. Isolated so it can sit inside <Suspense>.
function RedirectIfSignedIn() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  // Already signed in? Go to where the user wanted to be.
  useEffect(() => {
    if (!loading && user) router.replace(safeNext(params.get('next')));
  }, [loading, user, router, params]);
  return null;
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <Suspense><RedirectIfSignedIn /></Suspense>
      <div className="flex items-center justify-between"><Logo /><ThemeToggle /></div>
      <motion.div
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 20 }}
        className="my-auto py-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
