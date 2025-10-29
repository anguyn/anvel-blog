'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { TwoFactorSetup } from './two-factor-setup';
import { DisableTwoFactorDialog } from './disabled-two-factor-dialog';

interface SecuritySettingsFormProps {
  user: any;
  hasPassword: boolean;
  translations: any;
}

export function SecuritySettingsForm({
  user,
  hasPassword,
  translations,
}: SecuritySettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSuccessMessage(
        translations.passwordMismatch || 'Passwords do not match',
      );
      setShowSuccessDialog(true);
      return;
    }

    setIsLoading(true);

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
    } catch (error: any) {
      console.error('Error updating password:', error);
      setSuccessMessage(
        error.message ||
          translations.passwordError ||
          'Failed to update password',
      );
      setShowSuccessDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

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

            {hasPassword ? (
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
                    minLength={8}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {translations.passwordRequirements ||
                      'Password must be at least 8 characters long'}
                  </p>
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
                    minLength={8}
                    className="mt-1"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                >
                  <Button type="submit" disabled={isLoading}>
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
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Monitor className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold">
                  {translations.activeSessions || 'Active Sessions'}
                </h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.activeSessionsDescription ||
                    'Manage your active login sessions'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-[var(--color-secondary)] p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="font-medium">
                      {translations.currentDevice || 'Current Device'}
                    </span>
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                      {translations.currentSession || 'Active'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {translations.lastActiveNow || 'Last active: just now'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="outline" size="sm" disabled>
                  {translations.revokeAll || 'Revoke All Sessions'}
                </Button>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

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
          hasPassword={hasPassword}
        />
      )}

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-center">
              {translations.success || 'Success'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {successMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              {translations.ok || 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
