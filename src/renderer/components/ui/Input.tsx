import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  textarea?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ className, label, error, hint, icon, textarea, ...props }, ref) => {
    const Component = textarea ? 'textarea' : 'input';
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{label}</label>}
        <div className="relative">
          {icon && !textarea && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</div>}
          <Component
            ref={ref as any}
            className={cn(
              "flex w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm shadow-sm transition-colors placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
              !textarea && "h-9",
              textarea && "min-h-[80px]",
              icon && !textarea && "pl-9",
              error && "border-[var(--error)] focus-visible:ring-[var(--error)]",
              className
            )}
            {...(props as any)}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-[var(--error)]">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';