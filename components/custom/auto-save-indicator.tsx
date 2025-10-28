'use client';

import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/libs/utils';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  className?: string;
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  className,
}: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-600 dark:text-blue-400',
        };
      case 'saved':
        return {
          icon: <Check className="h-3 w-3" />,
          text: lastSaved
            ? `Saved ${formatTimeAgo(lastSaved)}`
            : 'All changes saved',
          color: 'text-green-600 dark:text-green-400',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Failed to save',
          color: 'text-destructive',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs font-medium transition-all duration-300',
        config.color,
        className,
      )}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return 'today';
}
