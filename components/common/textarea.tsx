import * as React from 'react';
import { cn } from '@/libs/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'focus-visible:ring-offset flex min-h-[80px] w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm ring-offset-[var(--color-background)] placeholder:text-[var(--color-muted-foreground)] focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
