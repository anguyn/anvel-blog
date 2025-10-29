'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface DisableTwoFactorDialogProps {
  onClose: () => void;
  translations: any;
  hasPassword: boolean;
}

export function DisableTwoFactorDialog({
  onClose,
  translations,
  hasPassword,
}: DisableTwoFactorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasPassword) {
      setResultMessage(
        translations.passwordRequired || 'Password is required to disable 2FA',
      );
      setIsSuccess(false);
      setShowResultDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setResultMessage(
        translations.twoFactorDisabled || '2FA disabled successfully',
      );
      setIsSuccess(true);
      setShowResultDialog(true);

      // Reload page after showing success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      setResultMessage(
        error.message || translations.twoFactorError || 'Failed to disable 2FA',
      );
      setIsSuccess(false);
      setShowResultDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mb-2 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <DialogTitle className="text-center">
              {translations.disableTwoFactor ||
                'Disable Two-Factor Authentication'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {translations.disableTwoFactorDescription ||
                'Enter your password and a verification code from your authenticator app to disable 2FA.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisable} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">
                {translations.password || 'Password'}
              </Label>
              <Input
                id="disable-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={
                  translations.enterPassword || 'Enter your password'
                }
                required
                disabled={!hasPassword}
              />
              {!hasPassword && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {translations.oauthPasswordNotAvailable ||
                    'Password authentication is not available for OAuth accounts'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="disable-token">
                {translations.verificationCode || 'Verification Code'}
              </Label>
              <Input
                id="disable-token"
                type="text"
                value={token}
                onChange={e =>
                  setToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000000"
                required
                maxLength={6}
                className="text-center font-mono text-2xl tracking-widest"
                autoComplete="off"
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {translations.enterCodeFromApp ||
                  'Enter the 6-digit code from your authenticator app'}
              </p>
            </div>

            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>{translations.warning || 'Warning'}:</strong>{' '}
                {translations.disableTwoFactorWarning ||
                  'Disabling 2FA will make your account less secure. Your backup codes will also be deleted.'}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {translations.cancel || 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  isLoading || !password || token.length !== 6 || !hasPassword
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translations.disabling || 'Disabling...'}
                  </>
                ) : (
                  translations.disableTwoFactor || 'Disable 2FA'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex justify-center">
              {isSuccess ? (
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              )}
            </div>
            <AlertDialogTitle className="text-center">
              {isSuccess
                ? translations.success || 'Success'
                : translations.error || 'Error'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {resultMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowResultDialog(false)}>
              {translations.ok || 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
