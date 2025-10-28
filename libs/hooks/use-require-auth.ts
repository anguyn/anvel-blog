'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from './use-current-user';

export function useRequireAuth(redirectUrl = '/login') {
  const { isAuthenticated, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectUrl]);

  return { isAuthenticated, isLoading };
}
