import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { LocaleProps } from '@/i18n/config';
import { redirect } from 'next/navigation';
import { SettingsLayout } from '@/components/blocks/pages/users/settings/settings-layout';
import { AccountSettingsForm } from '@/components/blocks/pages/users/settings/account-settings-form';
import { getCurrentUser } from '@/libs/server/rbac';

export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings/account`);
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
    accountSettings: t.settings.accountSettings,
    accountDescription: t.settings.accountDescription,
    emailSettings: t.settings.emailSettings,
    emailSettingsDescription: t.settings.emailSettingsDescription,
    changeEmail: t.settings.changeEmail,
    currentEmail: t.settings.currentEmail,
    emailVerified: t.settings.emailVerified,
    emailNotVerified: t.settings.emailNotVerified,
    verifyEmail: t.settings.verifyEmail,
    language: t.settings.language,
    languageDescription: t.settings.languageDescription,
    timezone: t.settings.timezone,
    timezoneDescription: t.settings.timezoneDescription,
    dangerZone: t.settings.dangerZone,
    dangerZoneDescription: t.settings.dangerZoneDescription,
    deactivateAccount: t.settings.deactivateAccount,
    deactivateAccountDescription: t.settings.deactivateAccountDescription,
    deactivateButton: t.settings.deactivateButton,
    deleteAccount: t.settings.deleteAccount,
    deleteAccountDescription: t.settings.deleteAccountDescription,
    deleteButton: t.settings.deleteButton,
    confirmDeactivate: t.settings.confirmDeactivate,
    confirmDelete: t.settings.confirmDelete,
    enterEmail: t.settings.enterEmail,
    enterPassword: t.settings.enterPassword,
    enterUsername: t.settings.enterUsername,
    enterConfirmationText: t.settings.enterConfirmationText,
    typeToConfirm: t.settings.typeToConfirm,
    cancel: t.settings.cancel,
    confirm: t.settings.confirm,
    processing: t.settings.processing,
    update: t.settings.update,
  };

  return (
    <MainLayout locale={locale}>
      <SettingsLayout locale={locale} translations={translations}>
        <AccountSettingsForm user={user} translations={translations} />
      </SettingsLayout>
    </MainLayout>
  );
}
