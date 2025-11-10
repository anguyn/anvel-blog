'use client';

import { cn } from '@/libs/utils';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({
  current,
  max,
  className,
}: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage > 90;
  const isDanger = percentage > 100;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'text-xs font-medium',
          isDanger
            ? 'text-destructive'
            : isWarning
              ? 'text-yellow-600 dark:text-yellow-500'
              : 'text-muted-foreground',
        )}
      >
        {current} / {max}
      </span>

      <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full transition-all duration-300',
            isDanger
              ? 'bg-destructive'
              : isWarning
                ? 'bg-yellow-500'
                : 'bg-primary',
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
