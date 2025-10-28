import * as React from 'react';
import { cn } from '@/libs/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:cursor-pointer';

    const variants = {
      default:
        'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90',
      destructive:
        'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:opacity-90',
      outline:
        'border border-[var(--color-input)] bg-[var(--color-background)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
      secondary:
        'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:opacity-80',
      ghost:
        'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
      link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button };
