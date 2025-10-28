'use client';

import { toast } from 'sonner';
import { useToastStore } from '@/store/toast';
import { useEffect } from 'react';

export function useToast() {
  const { message, type, clear } = useToastStore();

  useEffect(() => {
    if (message) {
      toast[type](message);
      clear();
    }
  }, [message]);

  const notify = {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    info: (msg: string) => toast.info(msg),
    warning: (msg: string) => toast.warning(msg),
  };

  return notify;
}
