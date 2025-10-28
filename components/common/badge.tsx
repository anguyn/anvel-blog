import * as React from 'react';
import { cn } from '@/libs/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default:
      'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-80',
    secondary:
      'border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:opacity-80',
    destructive:
      'border-transparent bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:opacity-80',
    outline: 'text-[var(--color-foreground)] border-[var(--color-border)]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2 focus:outline-none',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
