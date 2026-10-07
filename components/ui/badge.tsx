import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  className = '',
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-0.5 rounded-full gap-1.5',
  }[size];

  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    slate: 'bg-slate-900 text-slate-400 border-slate-800',
  }[variant];

  const dotColor = {
    default: 'bg-slate-400',
    indigo: 'bg-indigo-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    cyan: 'bg-cyan-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-500',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium border tracking-wide select-none ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />}
      {children}
    </span>
  );
}
