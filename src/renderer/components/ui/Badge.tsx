import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--surface-elevated)] text-[var(--text-primary)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20',
    error: 'bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/20',
    info: 'bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20',
    outline: 'border border-[var(--border)] text-[var(--text-secondary)]'
  };
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs'
  };
  return (
    <div className={cn("inline-flex items-center rounded-full font-medium transition-colors", variants[variant], sizes[size], className)} {...props}>
      {children}
    </div>
  );
}