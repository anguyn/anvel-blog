'use client';

import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/libs/utils';

interface SEOPreviewProps {
  title: string;
  description: string;
  url: string;
  className?: string;
}

export function SEOPreview({
  title,
  description,
  url,
  className,
}: SEOPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Truncate helpers
  const truncateTitle = (text: string, max: number) => {
    if (!text) return 'Untitled Page';
    return text.length > max ? text.substring(0, max) + '...' : text;
  };

  const truncateDescription = (text: string, max: number) => {
    if (!text) return 'No description available for this page.';
    return text.length > max ? text.substring(0, max) + '...' : text;
  };

  const titleMaxLength = device === 'desktop' ? 60 : 55;
  const descMaxLength = device === 'desktop' ? 160 : 120;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Device Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDevice('desktop')}
          className={cn(
            'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors',
            device === 'desktop'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          <Monitor className="h-3.5 w-3.5" />
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setDevice('mobile')}
          className={cn(
            'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors',
            device === 'mobile'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          <Smartphone className="h-3.5 w-3.5" />
          Mobile
        </button>
      </div>

      {/* Preview Box */}
      <div className="bg-background rounded-lg border p-4">
        <div className="space-y-1">
          {/* URL */}
          <div className="flex items-center gap-1 text-xs">
            <div className="bg-muted flex h-4 w-4 items-center justify-center rounded-full">
              <div className="bg-primary h-2 w-2 rounded-full" />
            </div>
            <span className="text-muted-foreground truncate">
              {url || 'https://yoursite.com/blog/post-slug'}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-primary cursor-pointer text-lg leading-tight font-medium hover:underline">
            {truncateTitle(title, titleMaxLength)}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-snug">
            {truncateDescription(description, descMaxLength)}
          </p>
        </div>
      </div>

      {/* Character Counts */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Title: </span>
          <span
            className={cn(
              'font-medium',
              title.length > titleMaxLength
                ? 'text-destructive'
                : title.length > titleMaxLength * 0.9
                  ? 'text-yellow-600 dark:text-yellow-500'
                  : 'text-green-600 dark:text-green-500',
            )}
          >
            {title.length}/{titleMaxLength}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Description: </span>
          <span
            className={cn(
              'font-medium',
              description.length > descMaxLength
                ? 'text-destructive'
                : description.length > descMaxLength * 0.9
                  ? 'text-yellow-600 dark:text-yellow-500'
                  : 'text-green-600 dark:text-green-500',
            )}
          >
            {description.length}/{descMaxLength}
          </span>
        </div>
      </div>
    </div>
  );
}
