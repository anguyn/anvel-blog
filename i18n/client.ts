'use client';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { LocaleProps } from './config';
import { TranslateDictionariesProps, usePathname, useRouter } from './routing';

const useCurrentLocale = () => {
  return useLocale() as LocaleProps;
};

const useTranslate = () => {
  const currentLocale = useCurrentLocale();
  const translate = (dictionaries: TranslateDictionariesProps) => {
    return dictionaries[currentLocale];
  };
  return { translate };
};

const useChangeLocale = () => {
  const router = useRouter();
  const [isChangingLocale, startTransition] = useTransition();
  const _pathname = usePathname();
  const changeLocale = ({
    locale,
    pathname = _pathname,
  }: {
    locale: LocaleProps;
    pathname?: string;
  }) => {
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  };
  return { isChangingLocale, changeLocale };
};

export { useChangeLocale, useCurrentLocale, useTranslate };
