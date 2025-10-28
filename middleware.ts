// import createMiddleware from 'next-intl/middleware';
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { routing } from '@/i18n/routing';
// import { auth } from '@/libs/server/auth';

// const intlMiddleware = createMiddleware(routing);

// // Helper function để check route matching với wildcard support
// function matchesRoute(path: string, patterns: string[]): boolean {
//   return patterns.some(pattern => {
//     // Convert wildcard pattern to regex
//     const regexPattern = pattern
//       .replace(/\*/g, '.*') // * -> .*
//       .replace(/\//g, '\\/'); // escape /

//     const regex = new RegExp(`^${regexPattern}(?:/|$)`);
//     return regex.test(path);
//   });
// }

// export default async function middleware(request: NextRequest) {
//   const { pathname, searchParams } = request.nextUrl;

//   // ✅ Skip parallel routes (@modal, @auth, etc.)
//   if (pathname.includes('/@')) {
//     return NextResponse.next();
//   }

//   // ✅ Skip intercepting routes - chỉ chạy intl middleware
//   if (pathname.match(/\/\([.]+\)/)) {
//     return intlMiddleware(request);
//   }

//   const localeMatch = pathname.match(/^\/(en|vi)(?=\/|$)/);
//   const locale = localeMatch ? localeMatch[1] : 'en';

//   const session = await auth();

//   const authRoutes = [
//     '/login',
//     '/register',
//     '/forgot-password',
//     '/verify-email',
//   ];

//   const protectedRoutes = [
//     '/dashboard',
//     '/profile',
//     '/settings',
//     '/snippets/new',
//     '/favorites',
//     '/admin/*',
//     '/user/*/settings',
//   ];

//   const basePath = pathname.replace(/^\/(en|vi)/, '');

//   // Redirect authenticated users away from auth routes
//   if (matchesRoute(basePath, authRoutes) && session) {
//     const callbackUrl = searchParams.get('callbackUrl');
//     if (callbackUrl) {
//       return NextResponse.redirect(
//         new URL(callbackUrl, request.nextUrl.origin),
//       );
//     }
//     return NextResponse.redirect(new URL(`/${locale}`, request.nextUrl.origin));
//   }

//   // Redirect unauthenticated users to login for protected routes
//   if (matchesRoute(basePath, protectedRoutes) && !session) {
//     const loginUrl = new URL(`/${locale}/login`, request.nextUrl.origin);
//     loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   return intlMiddleware(request);
// }

// export const config = {
//   matcher: [
//     '/',
//     '/(en|vi)/:path*',
//     // Exclude: api, _next, _vercel, static files
//     '/((?!api|_next|_vercel|.*\\..*).*)',
//   ],
// };

import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Helper function để check route matching với wildcard support
function matchesRoute(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*') // * -> .*
      .replace(/\//g, '\\/'); // escape /

    const regex = new RegExp(`^${regexPattern}(?:/|$)`);
    return regex.test(path);
  });
}

export default async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ✅ Skip parallel routes (@modal, @auth, etc.)
  if (pathname.includes('/@')) {
    return NextResponse.next();
  }

  // ✅ Skip intercepting routes - chỉ chạy intl middleware
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
  matcher: [
    '/',
    '/(en|vi)/:path*',
    // Exclude: api, _next, _vercel, static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
