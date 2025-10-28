'use client';

import { useLocaleStore } from '@/store/locale';
import { useChangeLocale, useCurrentLocale } from '@/i18n/client';
import { useEffect, useTransition } from 'react';
import { LocaleProps } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';

export function useLocale() {
  const store = useLocaleStore();
  const searchParams = useSearchParams();
  const { changeLocale: nextIntlChangeLocale, isChangingLocale } =
    useChangeLocale();
  const currentNextIntlLocale = useCurrentLocale();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (store.isHydrated && store.locale !== currentNextIntlLocale) {
      store.setLocale(currentNextIntlLocale);
    }
  }, [store.isHydrated, store.locale, currentNextIntlLocale, store.setLocale]);

  const changeLocale = (locale: LocaleProps, pathname?: string) => {
    store.setLocale(locale);
    store.setChanging(true);

    startTransition(() => {
      const currentPath = pathname || window.location.pathname;
      const pathWithoutLocale = currentPath.replace(/^\/(en|vi)/, '') || '/';

      const currentSearchParams = searchParams.toString();
      const pathnameWithParams = currentSearchParams
        ? `${pathWithoutLocale}?${currentSearchParams}`
        : pathWithoutLocale;

      nextIntlChangeLocale({
        locale,
        pathname: pathnameWithParams,
      });

      setTimeout(() => store.setChanging(false), 500);
    });
  };

  if (!store.isHydrated) {
    return {
      locale: currentNextIntlLocale || ('en' as LocaleProps),
      isChanging: false,
      isHydrated: false,
      changeLocale,
    };
  }

  return {
    locale: store.locale,
    isChanging: store.isChanging || isChangingLocale || isPending,
    isHydrated: store.isHydrated,
    changeLocale,
  };
}
