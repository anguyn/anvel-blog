import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { LocaleProps } from '@/i18n/config';
import { redirect } from 'next/navigation';
import { SettingsLayout } from '@/components/blocks/pages/users/settings/settings-layout';
import { SecuritySettingsForm } from '@/components/blocks/pages/users/settings/security-settings-form';
import { getCurrentUser } from '@/libs/server/rbac';

export const dynamic = 'force-dynamic';
export const generateStaticParams = getStaticParams;

export default async function SecuritySettingsPage({
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
    twoFactor: t.settings.twoFactor || 'Two-Factor Authentication',
    twoFactorDescription:
      t.settings.twoFactorDescription ||
      'Add an extra layer of security to your account',
    enable: t.settings.enable || 'Enable',
    disable: t.settings.disable || 'Disable',
    enabled: t.settings.enabled || 'Enabled',
    disabled: t.settings.disabled || 'Disabled',
    activeSessions: t.settings.activeSessions || 'Active Sessions',
    activeSessionsDescription:
      t.settings.activeSessionsDescription ||
      'Manage your active sessions across devices',
    currentSession: t.settings.currentSession || 'Current Session',
    revokeSession: t.settings.revokeSession || 'Revoke',
    revokeAll: t.settings.revokeAll || 'Revoke All Other Sessions',
    passwordUpdated:
      t.settings.passwordUpdated || 'Password updated successfully',
    passwordError: t.settings.passwordError || 'Failed to update password',
    passwordMismatch: t.settings.passwordMismatch || 'Passwords do not match',
    oauthPasswordNotAvailable:
      t.settings.oauthPasswordNotAvailable ||
      'You signed in with OAuth. Password management is not available.',
    emailAddress: t.settings.emailAddress || 'Email Address',
    confirmPasswordChange:
      t.settings.confirmPasswordChange || 'Confirm Password Change',
    confirmEmailPrompt:
      t.settings.confirmEmailPrompt ||
      'To confirm this action, please enter your email address:',
    emailMismatch: t.settings.emailMismatch || 'Email does not match',
    confirming: t.settings.confirming || 'Confirming...',
    confirm: t.settings.confirm || 'Confirm',
    strengthWeak: t.settings.strengthWeak || 'Weak',
    strengthMedium: t.settings.strengthMedium || 'Medium',
    strengthStrong: t.settings.strengthStrong || 'Strong',

    backupCodesWarning:
      t.settings.backupCodesWarning || 'Keep your backup codes safe',
    backupCodesDescription:
      t.settings.backupCodesDescription ||
      'You can use backup codes to access your account if you lose access to your authenticator app.',
    disableTwoFactor:
      t.settings.disableTwoFactor || 'Disable Two-Factor Authentication',
    disableTwoFactorPasswordDesc:
      t.settings.disableTwoFactorPasswordDesc ||
      'Enter your password to continue',
    disableTwoFactorOtpDesc:
      t.settings.disableTwoFactorOtpDesc ||
      'Enter the 6-digit code from your authenticator app',
    disableWarning:
      t.settings.disableWarning ||
      'Disabling 2FA will make your account less secure.',
    password: t.settings.password || 'Password',
    enterPassword: t.settings.enterPassword || 'Enter your password',
    verifying: t.settings.verifying || 'Verifying...',
    continue: t.settings.continue || 'Continue',
    verificationCode: t.settings.verificationCode || 'Verification Code',
    enterCodeFromApp:
      t.settings.enterCodeFromApp ||
      'Enter the 6-digit code from your authenticator app',
    back: t.settings.back || 'Back',
    disabling: t.settings.disabling || 'Disabling...',
    twoFactorDisabled:
      t.settings.twoFactorDisabled ||
      'Two-factor authentication has been disabled',
    invalidPassword: t.settings.invalidPassword || 'Invalid password',
    invalidCode: t.settings.invalidCode || 'Invalid verification code',
    currentDevice: t.settings.currentDevice || 'Current Device',
    lastActive: t.settings.lastActive || 'Last active',
    advancedSecurity: t.settings.advancedSecurity || 'Advanced Security',
    loginNotifications: t.settings.loginNotifications || 'Login Notifications',
    loginNotificationsDesc:
      t.settings.loginNotificationsDesc ||
      'Get notified of new logins to your account',
    trustedDevices: t.settings.trustedDevices || 'Trusted Devices',
    trustedDevicesDesc:
      t.settings.trustedDevicesDesc ||
      'Manage devices that skip 2FA verification',
    securityKeys: t.settings.securityKeys || 'Security Keys (WebAuthn)',
    securityKeysDesc:
      t.settings.securityKeysDesc ||
      'Use hardware security keys for authentication',
    comingSoon: t.settings.comingSoon || 'Coming Soon',
    developmentNote:
      t.settings.developmentNote ||
      'These features are currently under development and will be available soon.',
    success: t.settings.success || 'Success',
    ok: t.settings.ok || 'OK',
    cancel: t.settings.cancel || 'Cancel',
    samePassword:
      t.auth.samePassword ||
      'New password must be different from current password',
    auth: {
      passwordReset: {
        validation: t.auth.passwordReset.validation,
      },
    },
    securityReLoginMessage:
      t.settings.securityReLoginMessage ||
      'For security reasons, please log in again with your new password.',
    redirectingLogin: t.settings.redirectingLogin,
    disable2FA: t.settings.disable2FA,
  };

  return (
    <MainLayout locale={locale}>
      <SettingsLayout locale={locale} translations={translations}>
        <SecuritySettingsForm
          locale={locale}
          user={user}
          translations={translations}
        />
      </SettingsLayout>
    </MainLayout>
  );
}
