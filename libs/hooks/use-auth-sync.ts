'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore, type User } from '@/store/auth';

/**
 * Hook để sync NextAuth session với Zustand store
 * Sử dụng trong root layout hoặc providers
 */
export function useAuthSync() {
  const { data: session, status } = useSession();
  const { setAuth, clearAuth, isInitialized, setInitialized } = useUserStore();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user) {
      const user: User = {
        id: session.user.id || '',
        name: session.user.name || null,
        email: session.user.email || '',
        username: session.user.username || null,
        image: session.user.image || null,
        bio: session.user.bio || null,
        roleId: session.user.roleId || null,
        roleName: session.user.roleName || null,
        roleLevel: session.user.roleLevel || 0,
        permissions: session.user.permissions || [],
      };

      setAuth({ user });
    } else if (status === 'unauthenticated') {
      clearAuth();
    }

    if (!isInitialized) {
      setInitialized(true);
    }
  }, [session, status, setAuth, clearAuth, isInitialized, setInitialized]);

  return { status, isInitialized };
}
