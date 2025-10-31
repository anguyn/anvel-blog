import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { LocaleProps } from '@/i18n/config';
import { redirect } from 'next/navigation';
import { SettingsLayout } from '@/components/blocks/pages/users/settings/settings-layout';
import { getCurrentUser } from '@/libs/server/rbac';
import { AppearanceSettingsForm } from '@/components/blocks/pages/users/settings/appearance-settings-form';

export const dynamic = 'force-dynamic';
export const generateStaticParams = getStaticParams;

export default async function AppearanceSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings/security`);
  }

  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const translations = {
    settings: t.settings.settings,
    profile: t.settings.profile,
    account: t.settings.account,
    security: t.settings.security,
    notifications: t.settings.notifications,
    appearance: t.settings.appearance,
    appearanceSettings: t.settings.appearanceSettings,
    appearanceDescription: t.settings.appearanceDescription,
    theme: t.settings.theme,
    themeDescription: t.settings.themeDescription,
    light: t.settings.light,
    dark: t.settings.dark,
    system: t.settings.system,
    colorScheme: t.settings.colorScheme,
    colorSchemeDescription: t.settings.colorSchemeDescription,
    fontSize: t.settings.fontSize,
    fontSizeDescription: t.settings.fontSizeDescription,
    small: t.settings.small,
    medium: t.settings.medium,
    large: t.settings.large,
    codeTheme: t.settings.codeTheme,
    codeThemeDescription: t.settings.codeThemeDescription,
    compactMode: t.settings.compactMode,
    compactModeDescription: t.settings.compactModeDescription,
    reduceAnimations: t.settings.reduceAnimations,
    reduceAnimationsDescription: t.settings.reduceAnimationsDescription,
    showLineNumbers: t.settings.showLineNumbers,
    showLineNumbersDescription: t.settings.showLineNumbersDescription,
    fontFamily: t.settings.fontFamily,
    fontFamilyDescription: t.settings.fontFamilyDescription,
  };

  return (
    <MainLayout locale={locale}>
      <SettingsLayout locale={locale} translations={translations}>
        <AppearanceSettingsForm user={user} translations={translations} />
      </SettingsLayout>
    </MainLayout>
  );
}
