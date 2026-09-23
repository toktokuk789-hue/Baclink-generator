import React from 'react';
import { Badge } from './Badge';

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (['running', 'active', 'in progress'].includes(s)) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
        </span>
        <Badge variant="outline" className="border-[var(--accent)]/30 text-[var(--accent)] bg-[var(--accent)]/5">{status}</Badge>
      </div>
    );
  }
  if (['completed', 'success', 'done'].includes(s)) return <Badge variant="success">{status}</Badge>;
  if (['failed', 'error'].includes(s)) return <Badge variant="error">{status}</Badge>;
  if (['pending', 'queued', 'waiting'].includes(s)) return <Badge variant="warning">{status}</Badge>;
  return <Badge variant="default">{status}</Badge>;
}