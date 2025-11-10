'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/common/card';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import {
  Loader2,
  Shield,
  Lock,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Chrome,
  Globe,
  X,
  Info,
  Key,
  Clock,
  MapPin,
} from 'lucide-react';
import { TwoFactorSetup } from './two-factor-setup';
import { toast } from 'sonner';
import {
  PasswordValidationResult,
  validatePassword,
} from '@/libs/helpers/password.validator';
import { DisableTwoFactorDialog } from './disabled-two-factor-dialog';
import { useRouter } from 'next/navigation';

interface SecuritySettingsFormProps {
  user: any;
  locale: string;
  translations: any;
}

export function SecuritySettingsForm({
  user,
  locale,
  translations,
}: SecuritySettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidationResult | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const handlePasswordValidation = (password: string) => {
    if (password) {
      const result = validatePassword(password, translations);
      setPasswordValidation(result);
    } else {
      setPasswordValidation(null);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(translations.passwordMismatch || 'Passwords do not match');
      return;
    }

    const validation = validatePassword(passwordData.newPassword, translations);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }

    setShowEmailConfirmDialog(true);
  };

  const confirmPasswordChange = async () => {
    if (emailConfirmation.toLowerCase() !== user.email.toLowerCase()) {
      setEmailConfirmation('');
      toast.error(translations.emailMismatch || 'Email does not match');
      return;
    }

    setIsLoading(true);
    setShowEmailConfirmDialog(false);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccessMessage(
        translations.passwordUpdated || 'Password updated successfully',
      );
      setShowSuccessDialog(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setEmailConfirmation('');
      setPasswordValidation(null);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(
        error.message ||
          translations.passwordError ||
          'Failed to update password',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      if (
        passwordData.currentPassword &&
        value === passwordData.currentPassword
      ) {
        setPasswordValidation(prev => ({
          score: 1,
          valid: false,
          strength: 'weak',
          errors: [translations.samePassword],
        }));
        return;
      }
      handlePasswordValidation(value);
    }
  };

  const getStrengthColor = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'strong':
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getStrengthBgColor = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
    }
  };

  // Mock data for active sessions
  const activeSessions = [
    {
      id: '1',
      device: translations.currentDevice || 'Current Device',
      browser: 'Chrome on Windows',
      location: 'Ho Chi Minh City, Vietnam',
      lastActive: translations.lastActiveNow || 'just now',
      current: true,
      icon: Chrome,
    },
    {
      id: '2',
      device: 'iPhone 14 Pro',
      browser: 'Safari',
      location: 'Ho Chi Minh City, Vietnam',
      lastActive: '2 hours ago',
      current: false,
      icon: Smartphone,
    },
  ];

  useEffect(() => {
    if (!showSuccessDialog) return;

    setRedirectCountdown(5);

    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(
            `/${locale}/login?callbackUrl=/${locale}/settings/security`,
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSuccessDialog, locale, router]);

  return (
    <div className="space-y-6">
      <Card className="pt-6">
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {translations.changePassword || 'Change Password'}
                </h2>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.securityDescription ||
                    'Update your password to keep your account secure'}
                </p>
              </div>
            </div>

            {user?.hasPassword ? (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Label htmlFor="currentPassword" className="mb-2">
                    {translations.currentPassword || 'Current Password'}
                  </Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  <Label htmlFor="newPassword" className="mb-2">
                    {translations.newPassword || 'New Password'}
                  </Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />

                  {passwordValidation && passwordData.newPassword && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${getStrengthColor(passwordValidation.strength)}`}
                        >
                          {translations[
                            `strength${passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}`
                          ] || passwordValidation.strength}
                        </span>
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {passwordValidation.score}/100
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-secondary)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordValidation.score}%` }}
                          transition={{ duration: 0.3 }}
                          className={`h-full ${getStrengthBgColor(passwordValidation.strength)}`}
                        />
                      </div>
                      {passwordValidation.errors.length > 0 && (
                        <ul className="space-y-1 text-xs text-red-600 dark:text-red-400">
                          {passwordValidation.errors.map((error, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Label htmlFor="confirmPassword" className="mb-2">
                    {translations.confirmPassword || 'Confirm Password'}
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                >
                  <Button
                    type="submit"
                    disabled={
                      isLoading ||
                      !!(passwordValidation && !passwordValidation.valid)
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {translations.updating || 'Updating...'}
                      </>
                    ) : (
                      translations.updatePassword || 'Update Password'
                    )}
                  </Button>
                </motion.div>
              </form>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[var(--color-muted-foreground)]">
                  {translations.oauthPasswordNotAvailable ||
                    'You signed in with OAuth. Password management is not available.'}
                </p>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      <Card className="pt-6">
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">
                    {translations.twoFactor || 'Two-Factor Authentication'}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {translations.twoFactorDescription ||
                      'Add an extra layer of security to your account'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.twoFactorEnabled ? (
                  <>
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                      {translations.enabled || 'Enabled'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDisable2FA(true)}
                      disabled={isLoading}
                    >
                      {translations.disable || 'Disable'}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {translations.disabled || 'Disabled'}
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShow2FASetup(true)}
                    >
                      {translations.enable || 'Enable'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {user.twoFactorEnabled && (
              <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm">
                    <p className="mb-1 font-medium text-yellow-600 dark:text-yellow-400">
                      {translations.backupCodesWarning ||
                        'Keep your backup codes safe'}
                    </p>
                    <p className="text-yellow-600/80 dark:text-yellow-400/80">
                      {translations.backupCodesDescription ||
                        'You can use backup codes to access your account if you lose access to your authenticator app.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      <Card className="pt-6">
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">
                    {translations.activeSessions || 'Active Sessions'}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {translations.activeSessionsDescription ||
                      'Manage your active login sessions across all devices'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {activeSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex items-start justify-between rounded-lg bg-[var(--color-secondary)] p-4"
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <session.icon className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.device}</span>
                        {session.current && (
                          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                            {translations.currentSession || 'Current'}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5 text-sm text-[var(--color-muted-foreground)]">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          <span>{session.browser}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{session.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {translations.lastActive || 'Last active'}:{' '}
                            {session.lastActive}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  {translations.revokeAll || 'Revoke All Other Sessions'}
                </Button>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <Card className="pt-6">
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Key className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold">
                  {translations.advancedSecurity || 'Advanced Security'}
                </h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.advancedSecurityDescription ||
                    'Additional security features and options'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--color-border)] p-4 opacity-60">
                <div>
                  <div className="font-medium">
                    {translations.loginNotifications || 'Login Notifications'}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {translations.loginNotificationsDesc ||
                      'Get notified of new logins to your account'}
                  </p>
                </div>
                <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  {translations.comingSoon || 'Coming Soon'}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--color-border)] p-4 opacity-60">
                <div>
                  <div className="font-medium">
                    {translations.trustedDevices || 'Trusted Devices'}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {translations.trustedDevicesDesc ||
                      'Manage devices that skip 2FA verification'}
                  </p>
                </div>
                <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  {translations.comingSoon || 'Coming Soon'}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--color-border)] p-4 opacity-60">
                <div>
                  <div className="font-medium">
                    {translations.securityKeys || 'Security Keys (WebAuthn)'}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {translations.securityKeysDesc ||
                      'Use hardware security keys for authentication'}
                  </p>
                </div>
                <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  {translations.comingSoon || 'Coming Soon'}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {translations.developmentNote ||
                    'These features are currently under development and will be available soon.'}
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <AlertDialog
        open={showEmailConfirmDialog}
        onOpenChange={setShowEmailConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translations.confirmPasswordChange || 'Confirm Password Change'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {translations.confirmEmailPrompt ||
                'To confirm this action, please enter your email address:'}
              <div className="mt-2 space-y-2">
                <Label htmlFor="emailConfirm">
                  {translations.emailAddress || 'Email Address'}
                </Label>
                <Input
                  id="emailConfirm"
                  type="email"
                  value={emailConfirmation}
                  onChange={e => setEmailConfirmation(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && emailConfirmation && !isLoading) {
                      e.preventDefault();
                      confirmPasswordChange();
                    }
                  }}
                  placeholder={user.email}
                  autoFocus
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="hover:cursor-pointer"
              onClick={() => setEmailConfirmation('')}
            >
              {translations.cancel || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              className="hover:cursor-pointer"
              onClick={confirmPasswordChange}
              disabled={!emailConfirmation || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translations.confirming || 'Confirming...'}
                </>
              ) : (
                translations.confirm || 'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {show2FASetup && (
        <TwoFactorSetup
          onClose={() => setShow2FASetup(false)}
          translations={translations}
        />
      )}

      {showDisable2FA && (
        <DisableTwoFactorDialog
          onClose={() => setShowDisable2FA(false)}
          translations={translations}
          hasPassword={user?.hasPassword}
        />
      )}

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="animate-fadeIn scale-95 opacity-0 transition-all duration-500 ease-out data-[state=open]:scale-100 data-[state=open]:opacity-100">
          <AlertDialogHeader>
            <div className="mb-3 flex justify-center">
              <CheckCircle2 className="h-12 w-12 animate-bounce text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-center text-xl font-semibold">
              {translations.success || 'Success'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-2 text-center text-base">
              <p>{successMessage}</p>
              <p className="mt-3 text-sm text-gray-500">
                {translations.securityReLoginMessage ||
                  'For security reasons, please log in again with your new password.'}
              </p>
              <p className="text-xs text-gray-400">
                {typeof translations.redirectingLogin === 'function'
                  ? translations.redirectingLogin({
                      second: redirectCountdown.toString(),
                    })
                  : translations.redirectingLogin.replace(
                      '{second}',
                      redirectCountdown.toString(),
                    )}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              className="hover:cursor-pointer"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push(
                  `/${locale}/login?callbackUrl=/${locale}/settings/security`,
                );
              }}
            >
              {translations.ok || 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
