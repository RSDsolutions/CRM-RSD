'use client';

import { LucideIcon, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
  href?: string;
  urgency?: boolean;
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
    text: 'text-indigo-400',
    hoverBorder: 'hover:border-indigo-500/50',
    glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    text: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/50',
    glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    text: 'text-amber-400',
    hoverBorder: 'hover:border-amber-500/50',
    glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/25',
    text: 'text-rose-400',
    hoverBorder: 'hover:border-rose-500/50',
    glow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.12)]',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/25',
    text: 'text-cyan-400',
    hoverBorder: 'hover:border-cyan-500/50',
    glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/25',
    text: 'text-purple-400',
    hoverBorder: 'hover:border-purple-500/50',
    glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]',
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  href,
  urgency,
}: MetricCardProps) {
  const scheme = colorMap[color] || colorMap.indigo;

  const content = (
    <div
      className={`group relative p-5 rounded-2xl bg-slate-900 border border-slate-800/80 transition-all duration-200 select-none overflow-hidden shadow-lg shadow-black/20 ${
        href ? `cursor-pointer ${scheme.hoverBorder} ${scheme.glow} hover:-translate-y-0.5` : ''
      } ${urgency ? 'ring-1 ring-rose-500/40' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
          {title}
        </h3>
        <div className={`w-8 h-8 rounded-xl ${scheme.bg} ${scheme.border} border flex items-center justify-center ${scheme.text} flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div>
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {value}
          </span>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {href && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 group-hover:text-indigo-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
