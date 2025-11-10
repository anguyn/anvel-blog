import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

function matchesRoute(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}(?:/|$)`);
    return regex.test(path);
  });
}

export default async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.includes('/@')) {
    return NextResponse.next();
  }

  if (pathname.match(/\/\([.]+\)/)) {
    return intlMiddleware(request);
  }

  const localeMatch = pathname.match(/^\/(en|vi)(?=\/|$)/);
  const locale = localeMatch ? localeMatch[1] : 'en';

  const authRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/verify-email',
  ];

  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/snippets/new',
    '/favorites',
    '/admin/*',
    '/user/*/settings',
  ];

  const basePath = pathname.replace(/^\/(en|vi)/, '');

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|vi)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
