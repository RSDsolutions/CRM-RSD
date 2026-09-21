'use client';

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
  href?: string;
}

const colorMap = {
  indigo: 'bg-indigo-900/20 text-indigo-400 border-indigo-900/50',
  emerald: 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50',
  amber: 'bg-amber-900/20 text-amber-400 border-amber-900/50',
  rose: 'bg-rose-900/20 text-rose-400 border-rose-900/50',
  cyan: 'bg-cyan-900/20 text-cyan-400 border-cyan-900/50',
};

export function MetricCard({ title, value, subtitle, icon: Icon, color, href }: MetricCardProps) {
  const content = (
    <div className={`p-4 rounded-2xl border transition-all ${colorMap[color]} ${href ? 'hover:bg-slate-800/50 hover:border-slate-700 cursor-pointer' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{title}</h3>
        <Icon className="w-5 h-5 opacity-80" />
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-extrabold tracking-tight">{value}</span>
        {subtitle && <span className="text-xs text-slate-400 mb-1">{subtitle}</span>}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
