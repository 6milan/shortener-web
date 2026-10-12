'use client';
import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString(); },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={ref}>{value.toLocaleString()}</span>;
}
