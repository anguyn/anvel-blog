'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/common/card';
import { Button } from '@/components/common/button';
import { Loader2, CheckCircle2, XCircle, Clock, Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ThemeLocaleControls } from '@/components/common/theme-locale-control';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface VerifyEmailBlockProps {
  locale: string;
  translations: {
    title: string;
    verifying: string;
    verifyingDescription: string;
    redirectingLogin: string | ((params: { second: string }) => string);
    success: string;
    successMessage: string;
    error: string;
    expired: string;
    expiredMessage: string;
    invalidToken: string;
    alreadyVerified: string;
    resendEmail: string;
    resending: string;
    resendSuccess: string;
    resendError: string;
    rateLimitError: string;
    waitBeforeResend: string;
    goToLogin: string;
  };
}

type Status =
  | 'verifying'
  | 'success'
  | 'error'
  | 'expired'
  | 'already_verified';

export default function VerifyEmailBlock({
  locale,
  translations,
}: VerifyEmailBlockProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const t = useTranslations('login');

  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [email, setEmail] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage(translations.invalidToken);
      return;
    }

    verifyEmail(token);
  }, [token]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (
      resendTimer === 0 &&
      (status === 'expired' || status === 'error')
    ) {
      setCanResend(true);
    }
  }, [resendTimer, status]);

  useEffect(() => {
    if (status === 'success' || status === 'already_verified') {
      if (redirectCountdown > 0) {
        const timer = setTimeout(
          () => setRedirectCountdown(redirectCountdown - 1),
          1000,
        );
        return () => clearTimeout(timer);
      } else {
        router.push(`/${locale}/login`);
      }
    }
  }, [status, redirectCountdown, router, locale]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(
        `/api/auth/verify-email?token=${token}&lang=${locale}`,
      );
      const data = await response.json();

      if (response.ok) {
        if (data.alreadyVerified) {
          setStatus('already_verified');
        } else {
          setStatus('success');
          toast.success(translations.success);
          setTimeout(() => {
            router.push(`/${locale}/login`);
          }, 5000);
        }
      } else {
        if (data.expired) {
          setStatus('expired');
          setResendTimer(5);
        } else {
          setStatus('error');
        }
        setErrorMessage(data.error || translations.error);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(translations.error);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(translations.resendSuccess);
        setResendTimer(180); // 3 minutes cooldown
        setCanResend(false);
      } else if (response.status === 429) {
        const waitMinutes = Math.ceil((data.retryAfter || 180000) / 60000);
        toast.error(`${translations.rateLimitError} ${waitMinutes} minutes`);
        setResendTimer(Math.ceil((data.retryAfter || 180000) / 1000));
        setCanResend(false);
      } else {
        toast.error(data.error || translations.resendError);
      }
    } catch (error) {
      toast.error(translations.resendError);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="from-background to-secondary/20 relative flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <div className="absolute top-2 right-2 z-20 flex justify-center">
        <ThemeLocaleControls />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2">
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={48}
                height={48}
                priority
                className=""
              />
            </div>
          </Link>
          <h1 className="text-2xl font-bold">Anvel</h1>
          <p className="text-muted-foreground">{t('subTitle')}</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              {status === 'verifying' && (
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              )}
              {status === 'already_verified' && (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              )}
              {status === 'error' && (
                <XCircle className="text-destructive h-8 w-8" />
              )}
              {status === 'expired' && (
                <Clock className="h-8 w-8 text-orange-500" />
              )}
            </div>
            <CardTitle>
              {status === 'verifying' && translations.verifying}
              {status === 'success' && translations.success}
              {status === 'already_verified' && translations.alreadyVerified}
              {status === 'error' && translations.error}
              {status === 'expired' && translations.expired}
            </CardTitle>
            <CardDescription className="mt-2">
              {status === 'verifying' && translations.verifyingDescription}
              {status === 'success' && translations.successMessage}
              {status === 'already_verified' && translations.successMessage}
              {status === 'error' && errorMessage}
              {status === 'expired' && translations.expiredMessage}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {(status === 'success' || status === 'already_verified') && (
              <div className="space-y-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                  {typeof translations.redirectingLogin === 'function'
                    ? translations.redirectingLogin({
                        second: redirectCountdown.toString(),
                      })
                    : translations.redirectingLogin.replace(
                        '{second}',
                        redirectCountdown.toString(),
                      )}
                </div>
                <Link href={`/${locale}/login`}>
                  <Button className="w-full">{translations.goToLogin}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-sm">
          {t('followTerms')}{' '}
          <Link
            href={`/${locale}/terms-of-service`}
            className="hover:text-foreground underline"
          >
            {t('tos')}
          </Link>{' '}
          and{' '}
          <Link
            href={`/${locale}/privacy-policy`}
            className="hover:text-foreground underline"
          >
            {t('pp')}
          </Link>
        </p>
        <p className="text-center">{t('copyright')}</p>
      </div>
    </div>
  );
}
