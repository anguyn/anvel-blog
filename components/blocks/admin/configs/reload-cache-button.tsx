'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { reloadConfigCache } from '@/app/actions/config.action';
import { useToast } from '@/libs/hooks/use-toast';

export function ReloadCacheButton() {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleReload = (key?: string) => {
    startTransition(async () => {
      const result = await reloadConfigCache(key);

      if (result.success) {
        toast.success(result?.message || 'Successfully!');
      } else {
        toast.error(result?.error || 'Interal server error');
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          Reload Cache
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleReload()}>
          Reload All Configs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
