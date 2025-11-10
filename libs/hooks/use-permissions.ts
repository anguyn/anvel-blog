'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function usePermissions() {
  const { data: session, status } = useSession();

  const permissions = useMemo(() => {
    return session?.user?.permissions || [];
  }, [session]);

  const roleName = useMemo(() => {
    return session?.user?.roleName || null;
  }, [session]);

  const roleLevel = useMemo(() => {
    return session?.user?.roleLevel || 0;
  }, [session]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    // Admin has all permissions
    if (roleName === 'ADMIN') return true;

    return permissions.includes(permission);
  };

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (roleName === 'ADMIN') return true;

    return permissionList.some(p => permissions.includes(p));
  };

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (roleName === 'ADMIN') return true;

    return permissionList.every(p => permissions.includes(p));
  };

  /**
   * Check if user has minimum role level
   */
  const hasMinimumRole = (minLevel: number): boolean => {
    return roleLevel >= minLevel;
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = status === 'authenticated';

  /**
   * Check if user is admin
   */
  const isAdmin = roleName === 'ADMIN';

  /**
   * Check if user is author or higher
   */
  const isAuthor = roleLevel >= 50;

  /**
   * Check if user is editor or higher
   */
  const isEditor = roleLevel >= 80;

  return {
    permissions,
    roleName,
    roleLevel,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumRole,
    isAuthenticated,
    isAdmin,
    isAuthor,
    isEditor,
    isLoading: status === 'loading',
  };
}

/**
 * Hook to check if user can edit a resource
 */
export function useCanEdit(resourceUserId?: string) {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();

  const canEdit = useMemo(() => {
    if (!session?.user) return false;

    const isOwner = resourceUserId === session.user.id;

    const hasManagePermission = hasPermission('posts:manage');

    return isOwner || hasManagePermission;
  }, [session, resourceUserId, hasPermission]);

  return canEdit;
}

/**
 * Hook to check if user can delete a resource
 */
export function useCanDelete(resourceUserId?: string) {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();

  const canDelete = useMemo(() => {
    if (!session?.user) return false;

    const isOwner = resourceUserId === session.user.id;
    const hasManagePermission = hasPermission('posts:manage');

    return isOwner || hasManagePermission;
  }, [session, resourceUserId, hasPermission]);

  return canDelete;
}
