export const i18n = {
  locales: ['en', 'vi'], // SETUP - Multi Languages: Add/remove list of locale here
  defaultLocale: 'en', // SETUP - Multi Languages: Set default locale here
} as const;

export type LocaleProps = (typeof i18n)['locales'][number];
