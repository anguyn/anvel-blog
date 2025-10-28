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
import { signIn } from 'next-auth/react';

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
  orContinueWith: string;
  resendSuccess: string;
  waitBeforeResend: string;
  resendError: string;
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
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

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
        toast.success(translations.resendSuccess);
        router.push(
          `/${locale}/register?resend=true&email=${encodeURIComponent(email)}`,
        );
      } else if (response.status === 429) {
        const waitMinutes = Math.ceil((result.retryAfter || 180000) / 60000);
        toast.error(translations.waitBeforeResend);
      } else {
        toast.error(result.error || 'Failed to resend email');
      }
    } catch (error) {
      toast.error(translations.resendError);
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

  const handleOAuthLogin = async (
    provider: 'google' | 'github' | 'facebook',
  ) => {
    setOauthLoading(provider);
    try {
      await signIn(provider, {
        callbackUrl: callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.error(translations.somethingWentWrong);
      setOauthLoading(null);
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
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !!oauthLoading}
        >
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
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-2">
              {translations.orContinueWith}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading || oauthLoading !== null}
          >
            {oauthLoading === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading || oauthLoading !== null}
          >
            {oauthLoading === 'github' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('facebook')}
            disabled={isLoading || oauthLoading !== null}
          >
            {oauthLoading === 'facebook' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
