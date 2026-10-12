'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { copyText } from '@/lib/format';
import { useToast } from '@/context/toast';

export function CopyButton({ text, label = 'Copy link', className = '' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  async function copy() {
    if (await copyText(text)) {
      setDone(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setDone(false), 1600);
    } else toast.error('Could not copy. Select the text manually.');
  }
  return (
    <button onClick={copy} aria-label={label} title={label} className={`rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-violet-500 dark:hover:bg-white/10 ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={done ? 'ok' : 'copy'} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }} className="block">
          {done ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
