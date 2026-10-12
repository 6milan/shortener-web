'use client';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BreakdownItem, DailyClicks } from '@/lib/types';

export function ClicksChart({ data }: { data: DailyClicks[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            tickFormatter={(d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ stroke: '#8b5cf6', strokeOpacity: 0.3 }}
            contentStyle={{ borderRadius: 12, border: '1px solid rgba(148,163,184,.3)', fontSize: 12 }}
            labelFormatter={(d) => new Date(String(d) + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' })}
            formatter={(v) => [String(v), 'Clicks']}
          />
          <Area type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#clicksFill)" animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal bars that grow in; lighter than a chart library for simple breakdowns.
export function BarList({ items, empty = 'No data yet' }: { items: BreakdownItem[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((sum, i) => sum + i.count, 0) || 1;
  if (!items.length) return <p className="py-6 text-center text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={item.name}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate capitalize">{item.name}</span>
            <span className="ml-3 shrink-0 tabular-nums text-slate-500">
              {item.count.toLocaleString()} <span className="text-xs">({Math.round((item.count / total) * 100)}%)</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / max) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.07, ease: 'easeOut' }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
