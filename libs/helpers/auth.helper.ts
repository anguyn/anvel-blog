import { auth } from '@/libs/server/auth';
import { redirect } from 'next/navigation';

/**
 * Server Component: Require authentication
 * Sử dụng trong Server Components để protect pages
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  return session;
}

/**
 * Server Component: Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await auth();
  return !!session?.user;
}

/**
 * Server Component: Get current session
 */
export async function getSession() {
  return await auth();
}

/**
 * Server Component: Require specific permission
 */
export async function requirePermission(permission: string) {
  const session = await requireAuth();

  if (!session.user.permissions?.includes(permission)) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Server Component: Require admin role
 */
export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.roleName !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Server Component: Check if route is accessible
 * Trả về true/false thay vì redirect
 */
export async function canAccessRoute(routePermission?: string) {
  const session = await auth();

  if (!session?.user) {
    return false;
  }

  if (!routePermission) {
    return true;
  }

  return session.user.permissions?.includes(routePermission) || false;
}
