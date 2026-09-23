import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Spinner({ className, size = 24 }: { className?: string, size?: number }) {
  return <Loader2 size={size} className={cn("animate-spin text-[var(--text-muted)]", className)} />;
}