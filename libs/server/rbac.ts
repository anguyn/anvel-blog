import { auth } from '@/libs/server/auth';

// Permission format: "resource:action"
// Examples: "posts:create", "users:manage", "comments:delete"

/**
 * Check if user has a specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await auth();

  if (!session?.user) return false;

  const permissions = session.user.permissions || [];

  console.log('Permissions: ', permissions);

  // Admin has all permissions
  if (session.user.roleName === 'ADMIN') return true;

  return permissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export async function hasAnyPermission(
  permissions: string[],
): Promise<boolean> {
  const session = await auth();

  if (!session?.user) return false;

  const userPermissions = session.user.permissions || [];

  // Admin has all permissions
  if (session.user.roleName === 'ADMIN') return true;

  return permissions.some(p => userPermissions.includes(p));
}

/**
 * Check if user has ALL of the specified permissions
 */
export async function hasAllPermissions(
  permissions: string[],
): Promise<boolean> {
  const session = await auth();

  if (!session?.user) return false;

  const userPermissions = session.user.permissions || [];

  // Admin has all permissions
  if (session.user.roleName === 'ADMIN') return true;

  return permissions.every(p => userPermissions.includes(p));
}

/**
 * Check if user has minimum role level
 * Levels: USER=0, AUTHOR=50, EDITOR=80, ADMIN=100
 */
export async function hasMinimumRole(minLevel: number): Promise<boolean> {
  const session = await auth();

  if (!session?.user) return false;

  const userLevel = session.user.roleLevel || 0;

  return userLevel >= minLevel;
}

/**
 * Check if user is the owner of a resource
 */
export async function isResourceOwner(
  resourceUserId: string,
): Promise<boolean> {
  const session = await auth();

  if (!session?.user) return false;

  return session.user.id === resourceUserId;
}

/**
 * Check if user can perform action on resource
 * Combines permission check with ownership check
 */
export async function canPerformAction(
  permission: string,
  resourceUserId?: string,
): Promise<boolean> {
  const session = await auth();

  if (!session?.user) return false;

  // Check if user has the permission
  const hasPermissionResult = await hasPermission(permission);

  // If no resourceUserId provided, just check permission
  if (!resourceUserId) {
    return hasPermissionResult;
  }

  // Check ownership
  const isOwner = await isResourceOwner(resourceUserId);

  // User can perform action if:
  // 1. They have the general permission (e.g., "posts:manage"), OR
  // 2. They are the owner and have the basic permission (e.g., "posts:update")
  const hasManagePermission = await hasPermission(
    permission.replace(/:(update|delete)$/, ':manage'),
  );

  return hasManagePermission || (isOwner && hasPermissionResult);
}

/**
 * Require permission or throw error
 */
export async function requirePermission(
  permission: string,
  errorMessage?: string,
) {
  const allowed = await hasPermission(permission);

  if (!allowed) {
    throw new Error(errorMessage || `Permission denied: ${permission}`);
  }
}

/**
 * Require any permission or throw error
 */
export async function requireAnyPermission(
  permissions: string[],
  errorMessage?: string,
) {
  const allowed = await hasAnyPermission(permissions);

  if (!allowed) {
    throw new Error(
      errorMessage ||
        `Permission denied: requires one of ${permissions.join(', ')}`,
    );
  }
}

/**
 * Require minimum role level or throw error
 */
export async function requireMinimumRole(
  minLevel: number,
  errorMessage?: string,
) {
  const allowed = await hasMinimumRole(minLevel);

  if (!allowed) {
    throw new Error(
      errorMessage || `Insufficient role level: requires ${minLevel}`,
    );
  }
}

/**
 * Check if user is authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Get current user with full permissions
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user) return null;

  return {
    id: session.user.id!,
    email: session.user.email!,
    name: session.user.name || null,
    username: session.user.username || null,
    image: session.user.image || null,
    roleId: session.user.roleId || null,
    roleName: session.user.roleName || null,
    roleLevel: session.user.roleLevel || 0,
    permissions: session.user.permissions || [],
  };
}

// ============================================
// ROLE LEVEL CONSTANTS
// ============================================
export const RoleLevel = {
  USER: 0,
  AUTHOR: 50,
  EDITOR: 80,
  ADMIN: 100,
} as const;

// ============================================
// PERMISSION CONSTANTS
// ============================================
export const Permissions = {
  // Posts
  POSTS_CREATE: 'posts:create',
  POSTS_READ: 'posts:read',
  POSTS_UPDATE: 'posts:update',
  POSTS_DELETE: 'posts:delete',
  POSTS_PUBLISH: 'posts:publish',
  POSTS_MANAGE: 'posts:manage',

  // Comments
  COMMENTS_CREATE: 'comments:create',
  COMMENTS_UPDATE: 'comments:update',
  COMMENTS_DELETE: 'comments:delete',
  COMMENTS_MANAGE: 'comments:manage',

  // Media
  MEDIA_UPLOAD: 'media:upload',
  MEDIA_DELETE: 'media:delete',
  MEDIA_MANAGE: 'media:manage',

  // Users
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_MANAGE: 'users:manage',

  // Categories & Tags
  CATEGORIES_MANAGE: 'categories:manage',
  TAGS_MANAGE: 'tags:manage',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_MANAGE: 'settings:manage',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
} as const;
