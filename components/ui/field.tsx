'use client';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  right?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, Props>(function Field(
  { label, error, hint, icon, right, className, id, ...rest }, ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-err` : undefined}
          className={clsx('input', icon && 'pl-10', right && 'pr-11', error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/15')}
          {...rest}
        />
        {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
      </div>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            id={`${inputId}-err`}
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 text-xs text-rose-500"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" className="mt-1.5 text-xs text-slate-500">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
});
