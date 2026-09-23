import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      {icon && <div className="mb-4 rounded-full bg-[var(--surface-elevated)] p-4 text-[var(--text-muted)]">{icon}</div>}
      <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}