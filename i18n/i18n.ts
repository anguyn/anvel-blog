import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { i18n, LocaleProps } from '@/i18n/config';

// ============================================
// 1. FOR API ROUTES (has Request object)
// ============================================

/**
 * Detect locale from API request with multiple fallback strategies
 * USE THIS IN: app/api/.../route.ts
 */
export function detectApiLocale(request: Request | NextRequest): LocaleProps {
  // Strategy 1: Query parameter (?lang=vi)
  const url = new URL(request.url);
  const langParam =
    url.searchParams.get('lang') || url.searchParams.get('locale');
  if (langParam && i18n.locales.includes(langParam as LocaleProps)) {
    return langParam as LocaleProps;
  }

  // Strategy 2: Custom header (X-Locale: vi)
  const customHeader =
    request.headers.get('X-Locale') || request.headers.get('x-locale');
  if (customHeader && i18n.locales.includes(customHeader as LocaleProps)) {
    return customHeader as LocaleProps;
  }

  // Strategy 3: Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const locale = parseAcceptLanguage(acceptLanguage);
    if (locale) return locale;
  }

  // Strategy 4: Cookie (NEXT_LOCALE)
  if ('cookies' in request && typeof request.cookies.get === 'function') {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLocale && i18n.locales.includes(cookieLocale as LocaleProps)) {
      return cookieLocale as LocaleProps;
    }
  }

  // Strategy 5: Default
  return i18n.defaultLocale;
}

function interpolate(str: string, params?: Record<string, string | number>) {
  if (!params) return str;
  return Object.entries(params).reduce(
    (acc, [key, value]) =>
      acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
    str,
  );
}

/**
 * Get translated messages for API routes
 * USE THIS IN: app/api/.../route.ts
 */
export async function getApiTranslations(request: Request | NextRequest) {
  const locale = detectApiLocale(request);

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const dict = dictionaries[locale];

  // Tạo hàm dịch động
  const translate = (
    path: string,
    params?: Record<string, string | number>,
  ) => {
    const keys = path.split('.');
    let value: any = dict;
    for (const key of keys) {
      value = value?.[key];
    }
    if (typeof value === 'string') {
      return interpolate(value, params);
    }
    return value;
  };

  // Gắn hàm vào object t luôn (vừa là object, vừa callable)
  const t = Object.assign(translate, dict);

  return {
    locale,
    t,
  };
}

// ============================================
// 2. FOR SERVER ACTIONS (NO Request object)
// ============================================

/**
 * Detect locale from Next.js headers() in Server Actions
 * USE THIS IN: actions/auth.ts, actions/posts.ts, etc.
 */
export async function detectActionLocale(): Promise<LocaleProps> {
  try {
    const headersList = await headers();

    // Strategy 1: Cookie (NEXT_LOCALE) - most reliable in Server Actions
    const cookieHeader = headersList.get('cookie') || '';
    const localeMatch = cookieHeader.match(/NEXT_LOCALE=([^;]+)/);
    if (localeMatch) {
      const locale = localeMatch[1];
      if (i18n.locales.includes(locale as LocaleProps)) {
        return locale as LocaleProps;
      }
    }

    // Strategy 2: Custom header (X-Locale)
    const customHeader =
      headersList.get('X-Locale') || headersList.get('x-locale');
    if (customHeader && i18n.locales.includes(customHeader as LocaleProps)) {
      return customHeader as LocaleProps;
    }

    // Strategy 3: Accept-Language header
    const acceptLanguage = headersList.get('accept-language');
    if (acceptLanguage) {
      const locale = parseAcceptLanguage(acceptLanguage);
      if (locale) return locale;
    }
  } catch (error) {
    console.warn('Could not detect locale from headers:', error);
  }

  return i18n.defaultLocale;
}

/**
 * Get translated messages for Server Actions
 * USE THIS IN: actions/auth.ts, actions/posts.ts, etc.
 */
export async function getActionTranslations() {
  const locale = await detectActionLocale();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  return {
    locale,
    t: dictionaries[locale],
  };
}

// ============================================
// 3. SHARED HELPER
// ============================================

/**
 * Parse Accept-Language header
 * Example: "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
 */
function parseAcceptLanguage(header: string): LocaleProps | null {
  const languages = header
    .split(',')
    .map(lang => {
      const [locale, q = 'q=1'] = lang.trim().split(';');
      const quality = parseFloat(q.split('=')[1] || '1');
      return { locale: locale.split('-')[0], quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { locale } of languages) {
    if (i18n.locales.includes(locale as LocaleProps)) {
      return locale as LocaleProps;
    }
  }

  return null;
}
