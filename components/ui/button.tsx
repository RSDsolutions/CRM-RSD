import * as React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';
    
    const sizeStyles = {
      xs: 'text-[11px] px-2.5 py-1 gap-1.5 rounded-lg',
      sm: 'text-xs px-3 py-1.5 gap-2 rounded-lg',
      md: 'text-xs px-4 py-2 gap-2 rounded-xl',
      lg: 'text-sm px-5 py-2.5 gap-2.5 rounded-xl',
      icon: 'p-2 rounded-lg aspect-square',
    }[size];

    const variantStyles = {
      primary: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 border border-indigo-400/20',
      secondary: 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 shadow-sm',
      outline: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600',
      ghost: 'bg-transparent hover:bg-slate-800/70 text-slate-400 hover:text-white',
      destructive: 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-600/20 border border-rose-500/30',
      success: 'bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500/30',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
