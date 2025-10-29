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

export const dynamic = 'force-dynamic';
export const generateStaticParams = getStaticParams;

export default async function NotificationSettingsPage({
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
    settings: t.settings.settings || 'Settings',
    profile: t.settings.profile || 'Profile',
    account: t.settings.account || 'Account',
    security: t.settings.security || 'Security',
    notifications: t.settings.notifications || 'Notifications',
    appearance: t.settings.appearance || 'Appearance',

    // Security
    securitySettings: t.settings.securitySettings || 'Security Settings',
    securityDescription:
      t.settings.securityDescription ||
      'Manage your password and security preferences',
    changePassword: t.settings.changePassword || 'Change Password',
    currentPassword: t.settings.currentPassword || 'Current Password',
    newPassword: t.settings.newPassword || 'New Password',
    confirmPassword: t.settings.confirmPassword || 'Confirm Password',
    passwordRequirements:
      t.settings.passwordRequirements ||
      'Password must be at least 8 characters',
    updatePassword: t.settings.updatePassword || 'Update Password',
    updating: t.settings.updating || 'Updating...',

    // Two Factor
    twoFactor: t.settings.twoFactor || 'Two-Factor Authentication',
    twoFactorDescription:
      t.settings.twoFactorDescription ||
      'Add an extra layer of security to your account',
    enable: t.settings.enable || 'Enable',
    disable: t.settings.disable || 'Disable',
    enabled: t.settings.enabled || 'Enabled',
    disabled: t.settings.disabled || 'Disabled',

    // Sessions
    activeSessions: t.settings.activeSessions || 'Active Sessions',
    activeSessionsDescription:
      t.settings.activeSessionsDescription ||
      'Manage your active sessions across devices',
    currentSession: t.settings.currentSession || 'Current Session',
    revokeSession: t.settings.revokeSession || 'Revoke',
    revokeAll: t.settings.revokeAll || 'Revoke All Other Sessions',

    // Messages
    passwordUpdated:
      t.settings.passwordUpdated || 'Password updated successfully',
    passwordError: t.settings.passwordError || 'Failed to update password',
    passwordMismatch: t.settings.passwordMismatch || 'Passwords do not match',
  };

  return (
    <MainLayout locale={locale}>
      <SettingsLayout locale={locale} translations={translations}>
        <h1>Notification setting</h1>
      </SettingsLayout>
    </MainLayout>
  );
}
