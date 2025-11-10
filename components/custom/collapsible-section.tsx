'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/libs/utils';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('bg-card rounded-lg border', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-accent/50 flex w-full items-center justify-between rounded-t-lg p-4 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="font-semibold">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 p-4 pt-0 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
