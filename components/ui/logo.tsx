import Link from 'next/link';
import { Link2 } from 'lucide-react';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
        <Link2 className="h-5 w-5" />
      </span>
      <span className="text-lg">Snipp</span>
    </Link>
  );
}
