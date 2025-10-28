'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { authenticate } from '@/app/actions/login.action';
import { useSession } from 'next-auth/react';
import { cn } from '@/libs/utils';

interface LoginFormTranslations {
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  rememberMe: string;
  signIn: string;
  dontHaveAccount: string;
  signUp: string;
  invalidCredentials: string;
  loginSuccess: string;
  somethingWentWrong: string;
  invalidEmail: string;
  passwordMinLength: string;
  accountNotVerified: string;
  accountNotVerifiedMessage: string;
  accountSuspended: string;
  accountSuspendedMessage: string;
  accountBanned: string;
  accountBannedMessage: string;
  resendVerification: string;
  resending: string;
}

interface LoginFormProps {
  locale: string;
  translations: LoginFormTranslations;
  callbackUrl?: string;
}

export function LoginForm({
  locale,
  translations,
  callbackUrl = '/',
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Get error from URL
  const error = searchParams.get('error');
  const emailParam = searchParams.get('email');

  const loginSchema = z.object({
    email: z.string().email(translations.invalidEmail),
    password: z.string().min(6, translations.passwordMinLength),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Show error alerts based on URL params
  useEffect(() => {
    if (error && emailParam) {
      setValue('email', emailParam);
    }
  }, [error, emailParam, setValue]);

  const handleResendVerification = async () => {
    const email = emailParam || '';
    if (!email) return;

    setIsResending(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Verification email sent');
        router.push(
          `/${locale}/register?resend=true&email=${encodeURIComponent(email)}`,
        );
      } else if (response.status === 429) {
        const waitMinutes = Math.ceil((result.retryAfter || 180000) / 60000);
        toast.error(`Please wait ${waitMinutes} minutes before resending`);
      } else {
        toast.error(result.error || 'Failed to resend email');
      }
    } catch (error) {
      toast.error('Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await authenticate({
        email: data.email,
        password: data.password,
        rememberMe,
      });

      if (!result.success) {
        // Handle specific error codes
        if (result.code === 'BANNED') {
          toast.error(result.error || translations.accountBanned);
        } else if (result.code === 'SUSPENDED') {
          toast.error(result.error || translations.accountSuspended);
        } else if (result.code === 'UNVERIFIED') {
          toast.error(result.error || translations.accountNotVerified);
        } else {
          toast.error(result.error || translations.invalidCredentials);
        }
      } else {
        toast.success(translations.loginSuccess);
        await update();
        const welcomeUrl = `/${locale}/welcome?callbackUrl=${encodeURIComponent(callbackUrl)}&rememberMe=${rememberMe}`;
        router.push(welcomeUrl);
        // router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(translations.somethingWentWrong);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Unverified Account Alert */}
      {error === 'unverified' && emailParam && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {translations.accountNotVerified}
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {translations.accountNotVerifiedMessage ||
                  'Please verify your email before logging in'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={isResending}
                className="border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-900"
              >
                {isResending && (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                )}
                {translations.resendVerification}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Banned Account Alert */}
      {error === 'banned' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {translations.accountBanned}
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {translations.accountBannedMessage ||
                  'Your account has been permanently banned. Please contact support.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Suspended Account Alert */}
      {error === 'suspended' && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {translations.accountSuspended}
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {translations.accountSuspendedMessage ||
                  'Your account has been temporarily suspended. Please contact support.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {translations.email} <span className="text-red-400">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={translations.emailPlaceholder}
            disabled={isLoading}
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              {translations.password} <span className="text-red-400">*</span>
            </Label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-primary text-sm hover:underline"
            >
              {translations.forgotPassword}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder={translations.passwordPlaceholder}
            disabled={isLoading}
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={checked => setRememberMe(checked as boolean)}
            disabled={isLoading}
            className={cn(!isLoading && 'hover:cursor-pointer')}
          />
          <Label
            htmlFor="rememberMe"
            className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {translations.rememberMe}
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {translations.signIn}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {translations.dontHaveAccount}{' '}
          </span>
          <Link
            href={`/${locale}/register`}
            className="text-primary font-medium hover:underline"
          >
            {translations.signUp}
          </Link>
        </div>
      </form>
    </div>
  );
}
