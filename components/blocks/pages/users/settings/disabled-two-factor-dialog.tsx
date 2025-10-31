'use client';

import { useState, useRef, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import { OTPInput, OTPInputRef } from '@/components/custom/otp-input';
import { Loader2, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';

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
  const [step, setStep] = useState<'password' | 'otp'>('password');
  const [password, setPassword] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [otpError, setOtpError] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<OTPInputRef>(null);

  useEffect(() => {
    if (step === 'password' && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [step]);

  const handleDisable2FA = async () => {
    if (!password || otpValue.length !== 6) {
      if (!password) {
        setPasswordError(true);
        setStep('password');
        setTimeout(() => passwordRef.current?.focus(), 100);
      } else if (otpValue.length !== 6) {
        setOtpError(true);
        setStep('otp');
        setTimeout(() => otpRef.current?.focus(), 100);
      }
      return;
    }

    setIsLoading(true);
    setPasswordError(false);
    setOtpError(false);

    try {
      const response = await fetch('/api/user/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          token: otpValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          if (data.error?.toLowerCase().includes('password')) {
            setPasswordError(true);
            setPassword('');
            setStep('password');
            setTimeout(() => passwordRef.current?.focus(), 100);
            toast.error(
              data.error || translations.invalidPassword || 'Invalid password',
            );
          } else {
            setOtpError(true);
            otpRef.current?.clear();
            setOtpValue('');
            setStep('otp');
            setTimeout(() => otpRef.current?.focus(), 100);
            toast.error(
              data.error ||
                translations.invalidCode ||
                'Invalid verification code',
            );
          }
        } else {
          throw new Error(data.error || 'Failed to disable 2FA');
        }
        return;
      }

      toast.success(
        data.message ||
          translations.twoFactorDisabled ||
          'Two-factor authentication has been disabled',
      );
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error('2FA disable error:', error);
      toast.error(
        error.message ||
          translations.failedToDisable ||
          'Failed to disable 2FA',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpComplete = (otp: string) => {
    setOtpValue(otp);
    setOtpError(false);
  };

  const handleOtpChange = (value: string) => {
    setOtpValue(value);
    setOtpError(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError(false);
  };

  const handleNext = () => {
    if (!password) {
      setPasswordError(true);
      passwordRef.current?.focus();
      return;
    }
    setStep('otp');
  };

  const handleBack = () => {
    setStep('password');
    setOtpError(false);
  };

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mb-2 flex justify-center">
            <div className="rounded-full bg-red-500/10 p-3">
              <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            {translations.disableTwoFactor ||
              'Disable Two-Factor Authentication'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {step === 'password'
              ? translations.disableTwoFactorPasswordDesc ||
                'Enter your password to continue'
              : translations.disableTwoFactorOtpDesc ||
                'Enter the 6-digit code from your authenticator app'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {translations.disableWarning ||
                  'Disabling 2FA will make your account less secure.'}
              </p>
            </div>
          </div>

          {hasPassword && (
            <div className={`space-y-2 ${step === 'otp' ? 'opacity-50' : ''}`}>
              <Label htmlFor="password">
                {translations.password || 'Password'}
              </Label>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={e => {
                  if (e.key === 'Enter' && step == 'password') {
                    e.preventDefault();
                    handleNext();
                  }
                }}
                placeholder={
                  translations.enterPassword || 'Enter your password'
                }
                required
                disabled={isLoading || step === 'otp'}
                className={passwordError ? 'border-red-500' : ''}
              />
              {passwordError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {translations.passwordRequired || 'Password is required'}
                </p>
              )}
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-2">
              <Label htmlFor="otp" className="mb-2 block text-center">
                {translations.verificationCode || 'Verification Code'}
              </Label>
              <div className="flex justify-center">
                <OTPInput
                  ref={otpRef}
                  length={6}
                  value={otpValue}
                  onChange={handleOtpChange}
                  onComplete={handleOtpComplete}
                  onEnter={handleDisable2FA}
                  disabled={isLoading}
                  autoFocus
                  type="numeric"
                  error={otpError}
                />
              </div>
              <p className="text-center text-xs text-[var(--color-muted-foreground)]">
                {translations.enterCodeFromApp ||
                  'Enter the 6-digit code from your authenticator app'}
              </p>
              {otpError && (
                <p className="text-center text-xs text-red-600 dark:text-red-400">
                  {translations.codeRequired || 'Verification code is required'}
                </p>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={step === 'otp' && hasPassword ? handleBack : onClose}
            disabled={isLoading}
          >
            {step === 'otp' && hasPassword
              ? translations.back || 'Back'
              : translations.cancel || 'Cancel'}
          </Button>
          {step === 'password' ? (
            <Button
              variant="destructive"
              onClick={handleNext}
              disabled={isLoading || !password}
            >
              {translations.continue || 'Continue'}
            </Button>
          ) : (
            <Button
              variant="destructive"
              disabled={isLoading || otpValue.length !== 6}
              onClick={handleDisable2FA}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translations.disabling || 'Disabling...'}
                </>
              ) : (
                translations.disable2FA || 'Disable 2FA'
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
