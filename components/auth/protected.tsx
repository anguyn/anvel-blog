'use client';

// CHƯA SỬ DỤNG, KHÔNG QUAN TÂM

import { usePermissions } from '@/libs/hooks/use-permissions';
import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface ProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

// ============================================
// PERMISSION-BASED PROTECTION
// ============================================

/**
 * Show content only if user has specific permission
 * @example
 * <WithPermission permission="posts:create">
 *   <CreatePostButton />
 * </WithPermission>
 */
interface WithPermissionProps extends ProtectedProps {
  permission: string;
}

export function WithPermission({
  children,
  permission,
  fallback = null,
  loadingFallback = null,
}: WithPermissionProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Show content only if user has ANY of the permissions
 * @example
 * <WithAnyPermission permissions={["posts:update", "posts:manage"]}>
 *   <EditPostButton />
 * </WithAnyPermission>
 */
interface WithAnyPermissionProps extends ProtectedProps {
  permissions: string[];
}

export function WithAnyPermission({
  children,
  permissions,
  fallback = null,
  loadingFallback = null,
}: WithAnyPermissionProps) {
  const { hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Show content only if user has ALL permissions
 * @example
 * <WithAllPermissions permissions={["posts:update", "posts:publish"]}>
 *   <PublishButton />
 * </WithAllPermissions>
 */
interface WithAllPermissionsProps extends ProtectedProps {
  permissions: string[];
}

export function WithAllPermissions({
  children,
  permissions,
  fallback = null,
  loadingFallback = null,
}: WithAllPermissionsProps) {
  const { hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!hasAllPermissions(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// ROLE-BASED PROTECTION
// ============================================

/**
 * Show content only if user has minimum role level
 * Levels: USER=0, AUTHOR=50, EDITOR=80, ADMIN=100
 * @example
 * <WithMinimumRole minLevel={50}>
 *   <AuthorDashboard />
 * </WithMinimumRole>
 */
interface WithMinimumRoleProps extends ProtectedProps {
  minLevel: number;
}

export function WithMinimumRole({
  children,
  minLevel,
  fallback = null,
  loadingFallback = null,
}: WithMinimumRoleProps) {
  const { hasMinimumRole, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!hasMinimumRole(minLevel)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Show content only if user has specific role
 * @example
 * <WithRole role="ADMIN">
 *   <AdminPanel />
 * </WithRole>
 */
interface WithRoleProps extends ProtectedProps {
  role: string;
}

export function WithRole({
  children,
  role,
  fallback = null,
  loadingFallback = null,
}: WithRoleProps) {
  const { roleName, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (roleName !== role) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// AUTHENTICATION-BASED PROTECTION
// ============================================

/**
 * Show content only if authenticated
 * @example
 * <WithAuth fallback={<LoginPrompt />}>
 *   <UserProfile />
 * </WithAuth>
 */
export function WithAuth({
  children,
  fallback = null,
  loadingFallback = null,
}: ProtectedProps) {
  const { isAuthenticated, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Show content only if NOT authenticated (opposite of WithAuth)
 * @example
 * <WithGuest>
 *   <LoginForm />
 * </WithGuest>
 */
export function WithGuest({
  children,
  fallback = null,
  loadingFallback = null,
}: ProtectedProps) {
  const { isAuthenticated, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// ROLE SHORTCUTS
// ============================================

/**
 * Show content only if user is admin
 * @example
 * <AdminOnly fallback={<AccessDenied />}>
 *   <AdminDashboard />
 * </AdminOnly>
 */
export function AdminOnly({
  children,
  fallback = null,
  loadingFallback = null,
}: ProtectedProps) {
  const { isAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Show content only if user is author or higher
 * @example
 * <AuthorOnly fallback={<UpgradePrompt />}>
 *   <CreatePostForm />
 * </AuthorOnly>
 */
export function AuthorOnly({
  children,
  fallback = null,
  loadingFallback = null,
}: ProtectedProps) {
  const { isAuthor, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthor) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Show content only if user is editor or higher
 * @example
 * <EditorOnly>
 *   <ModerateComments />
 * </EditorOnly>
 */
export function EditorOnly({
  children,
  fallback = null,
  loadingFallback = null,
}: ProtectedProps) {
  const { isEditor, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isEditor) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// OWNERSHIP-BASED PROTECTION
// ============================================

/**
 * Show content only if user is the owner of the resource
 * @example
 * <WithOwnership resourceUserId={post.authorId}>
 *   <EditButton />
 * </WithOwnership>
 */
interface WithOwnershipProps extends ProtectedProps {
  resourceUserId?: string;
  allowManagePermission?: boolean; // Allow users with manage permission
  managePermission?: string; // e.g., "posts:manage"
}

export function WithOwnership({
  children,
  resourceUserId,
  allowManagePermission = true,
  managePermission = '',
  fallback = null,
  loadingFallback = null,
}: WithOwnershipProps) {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();

  if (status === 'loading') {
    return <>{loadingFallback}</>;
  }

  if (!session?.user || !resourceUserId) {
    return <>{fallback}</>;
  }

  const isOwner = session.user.id === resourceUserId;
  const hasManage =
    allowManagePermission && managePermission
      ? hasPermission(managePermission)
      : false;

  if (!isOwner && !hasManage) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// COMBINED PROTECTION
// ============================================

/**
 * Show content if user is owner OR has permission
 * @example
 * <WithOwnerOrPermission
 *   resourceUserId={post.authorId}
 *   permission="posts:manage"
 * >
 *   <DeleteButton />
 * </WithOwnerOrPermission>
 */
interface WithOwnerOrPermissionProps extends ProtectedProps {
  resourceUserId?: string;
  permission: string;
}

export function WithOwnerOrPermission({
  children,
  resourceUserId,
  permission,
  fallback = null,
  loadingFallback = null,
}: WithOwnerOrPermissionProps) {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();

  if (status === 'loading') {
    return <>{loadingFallback}</>;
  }

  if (!session?.user) {
    return <>{fallback}</>;
  }

  const isOwner = resourceUserId === session.user.id;
  const hasPerm = hasPermission(permission);

  if (!isOwner && !hasPerm) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// UTILITY COMPONENTS
// ============================================

/**
 * Conditional rendering based on multiple conditions
 * @example
 * <ConditionalRender
 *   condition={() => {
 *     const { isAdmin, hasPermission } = usePermissions();
 *     return isAdmin || hasPermission('posts:manage');
 *   }}
 * >
 *   <ManageButton />
 * </ConditionalRender>
 */
interface ConditionalRenderProps extends ProtectedProps {
  condition: () => boolean;
}

export function ConditionalRender({
  children,
  condition,
  fallback = null,
  loadingFallback = null,
}: ConditionalRenderProps) {
  const { isLoading } = usePermissions();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!condition()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// RENDER PROPS PATTERN (Alternative approach)
// ============================================

/**
 * Render props pattern for more flexibility
 * @example
 * <ProtectedRender>
 *   {({ isAdmin, hasPermission, isLoading }) => {
 *     if (isLoading) return <Spinner />;
 *     if (isAdmin) return <AdminPanel />;
 *     if (hasPermission('posts:create')) return <CreateButton />;
 *     return <AccessDenied />;
 *   }}
 * </ProtectedRender>
 */
interface ProtectedRenderProps {
  children: (permissions: ReturnType<typeof usePermissions>) => ReactNode;
}

export function ProtectedRender({ children }: ProtectedRenderProps) {
  const permissions = usePermissions();
  return <>{children(permissions)}</>;
}
