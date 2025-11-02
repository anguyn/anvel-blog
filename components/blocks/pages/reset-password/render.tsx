'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/common/card';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';
import { ThemeLocaleControls } from '@/components/common/theme-locale-control';
import { useTranslations } from 'next-intl';

interface ResetPasswordBlockProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    resetPassword: string;
    resetting: string;
    success: string;
    successMessage: string;
    error: string;
    expired: string;
    expiredMessage: string;
    invalidToken: string;
    passwordTooWeak: string;
    passwordsDontMatch: string;
    goToLogin: string;
    expiresIn: string;
    passwordRequirements: string;
    requirement8Chars: string;
    requirementUppercase: string;
    requirementLowercase: string;
    requirementNumber: string;
    requirementSpecial: string;
    invalidLink: string;
    redirectingLogin: string | ((params: { second: string }) => string);
    requestNewLink: string;
    requestNewLinkDes: string;
  };
}

type Status = 'loading' | 'valid' | 'expired' | 'invalid' | 'success';

export default function ResetPasswordBlock({
  locale,
  translations,
}: ResetPasswordBlockProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const t = useTranslations('login');

  const [status, setStatus] = useState<Status>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expiryTimer, setExpiryTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const resetPasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, translations.requirement8Chars)
        .regex(/[A-Z]/, translations.requirementUppercase)
        .regex(/[a-z]/, translations.requirementLowercase)
        .regex(/[0-9]/, translations.requirementNumber)
        .regex(
          /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
          translations.requirementSpecial,
        ),
      confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: translations.passwordsDontMatch,
      path: ['confirmPassword'],
    });

  type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchPassword = watch('password');

  useEffect(() => {
    if (watchPassword) {
      setPassword(watchPassword);
    }
  }, [watchPassword]);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    verifyToken(token);
  }, [token]);

  useEffect(() => {
    if (expiryTimer > 0) {
      const timer = setTimeout(() => setExpiryTimer(expiryTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (expiryTimer === 0 && status === 'valid') {
      setStatus('expired');
      toast.error(translations.expired);
    }
  }, [expiryTimer, status]);

  useEffect(() => {
    if (status === 'success') {
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push(`/${locale}/login`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [status, router, locale]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${token}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setStatus('valid');
        setExpiryTimer(data.expiresIn || 0);
      } else {
        setStatus(data.expired ? 'expired' : 'invalid');
      }
    } catch (error) {
      setStatus('invalid');
    }
  };

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        toast.success(translations.success);
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 3000);
      } else {
        if (result.expired) {
          setStatus('expired');
        }
        toast.error(result.error || translations.error);
      }
    } catch (error) {
      toast.error(translations.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const PasswordRequirement = ({
    met,
    text,
  }: {
    met: boolean;
    text: string;
  }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="text-muted-foreground h-4 w-4" />
      )}
      <span
        className={
          met ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
        }
      >
        {text}
      </span>
    </div>
  );

  return (
    <div className="from-background to-secondary/20 relative min-h-screen bg-gradient-to-br">
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 py-8 md:flex-row md:gap-0 md:py-4">
        <div className="md:absolute md:top-4 md:right-4 md:z-50">
          <ThemeLocaleControls />
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2"
            >
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
                {status === 'loading' && (
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                )}
                {status === 'valid' && expiryTimer > 0 && (
                  <Clock className="text-primary h-8 w-8" />
                )}
                {status === 'success' && (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
                {(status === 'expired' || status === 'invalid') && (
                  <XCircle className="text-destructive h-8 w-8" />
                )}
              </div>

              <CardTitle>
                {status === 'loading' && 'Verifying...'}
                {status === 'valid' && translations.title}
                {status === 'success' && translations.success}
                {status === 'expired' && translations.expired}
                {status === 'invalid' && translations.invalidToken}
              </CardTitle>
              <CardDescription className="mt-2">
                {status === 'valid' && translations.subtitle}
                {status === 'success' && translations.successMessage}
                {status === 'expired' && translations.expiredMessage}
                {status === 'invalid' && translations.invalidLink}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {status === 'valid' && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {expiryTimer > 0 && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          {translations.expiresIn}:{' '}
                          <strong>{formatTime(expiryTimer)}</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      {translations.password}{' '}
                      <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={translations.passwordPlaceholder}
                        disabled={isSubmitting}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground absolute top-3 right-3"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-sm">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {password && (
                    <div className="bg-muted/50 space-y-2 rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs font-medium">
                        {translations.passwordRequirements}
                      </p>
                      <PasswordRequirement
                        met={passwordChecks.length}
                        text={translations.requirement8Chars}
                      />
                      <PasswordRequirement
                        met={passwordChecks.uppercase}
                        text={translations.requirementUppercase}
                      />
                      <PasswordRequirement
                        met={passwordChecks.lowercase}
                        text={translations.requirementLowercase}
                      />
                      <PasswordRequirement
                        met={passwordChecks.number}
                        text={translations.requirementNumber}
                      />
                      <PasswordRequirement
                        met={passwordChecks.special}
                        text={translations.requirementSpecial}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium"
                    >
                      {translations.confirmPassword}{' '}
                      <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={translations.confirmPasswordPlaceholder}
                        disabled={isSubmitting}
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="text-muted-foreground hover:text-foreground absolute top-3 right-3"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-destructive text-sm">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || expiryTimer === 0}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isSubmitting
                      ? translations.resetting
                      : translations.resetPassword}
                  </Button>
                </form>
              )}

              {status === 'success' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                    <p className="text-center text-sm text-green-800 dark:text-green-200">
                      {typeof translations.redirectingLogin === 'function'
                        ? translations.redirectingLogin({
                            second: redirectCountdown.toString(),
                          })
                        : translations.redirectingLogin.replace(
                            '{second}',
                            redirectCountdown.toString(),
                          )}
                    </p>
                  </div>
                  <Link href={`/${locale}/login`}>
                    <Button className="w-full">{translations.goToLogin}</Button>
                  </Link>
                </div>
              )}

              {(status === 'expired' || status === 'invalid') && (
                <div className="space-y-4">
                  <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
                    <p className="text-destructive text-center text-sm">
                      {status === 'expired'
                        ? translations.expiredMessage
                        : translations.requestNewLinkDes}
                    </p>
                  </div>
                  <Link href={`/${locale}/forgot-password`}>
                    <Button variant="outline" className="w-full">
                      {translations.requestNewLink}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/login`}>
                    <Button variant="ghost" className="w-full">
                      {translations.goToLogin}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-center text-sm">
            {t('followTerms')}{' '}
            <Link
              href={`/${locale}/terms-of-service`}
              prefetch
              className="hover:text-foreground underline"
            >
              {t('tos')}
            </Link>{' '}
            and{' '}
            <Link
              href={`/${locale}/privacy-policy`}
              prefetch
              className="hover:text-foreground underline"
            >
              {t('pp')}
            </Link>
          </p>
          <p className="text-center">{t('copyright')}</p>
        </div>
      </div>
    </div>
  );
}
