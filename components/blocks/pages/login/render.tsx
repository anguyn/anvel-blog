'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { useLocale } from '@/libs/hooks/use-locale';
import { ThemeLocaleControls } from '@/components/common/theme-locale-control';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

interface LoginFormTranslations {
  signInTitle: string;
  welcomeBack: string;
  subTitle: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  signIn: string;
  dontHaveAccount: string;
  signUp: string;
  invalidCredentials: string;
  loginSuccess: string;
  somethingWentWrong: string;
  invalidEmail: string;
  passwordMinLength: string;
  followTerms: string;
  tos: string;
  pp: string;
  orContinueWith: string;
  resendSuccess: string;
  rememberMe: string;
  accountNotVerified: string;
  accountNotVerifiedMessage: string;
  accountSuspended: string;
  accountSuspendedMessage: string;
  accountBanned: string;
  accountBannedMessage: string;
  resendVerification: string;
  resending: string;
  waitBeforeResend: string;
  resendError: string;
  twoFactorTitle: string;
  twoFactorDescription: string;
  twoFactorCode: string;
  twoFactorCodePlaceholder: string;
  backupCode: string;
  backupCodePlaceholder: string;
  useBackupCode: string;
  useAuthenticatorCode: string;
  backToLogin: string;
  verify: string;
  invalid2FACode: string;
  twoFactorRequired: string;
  twoFactorError: string;
  turnstileError: string;
  turnstileExpire: string;
  enterBackupCode: string;
  confirm2FALeave: string;
  invalidBackupCode: string;
}

interface LoginRenderBlockProps {
  translations: LoginFormTranslations;
}

const LoginRenderBlock = ({ translations }: LoginRenderBlockProps) => {
  const { locale } = useLocale();
  const t = useTranslations('login');
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get('callbackUrl') || `/${locale}`;

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
          <p className="text-muted-foreground">
            {translations.subTitle || t('subTitle')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {translations.welcomeBack || t('welcomeBack')}
            </CardTitle>
            <CardDescription>
              {translations.signInTitle || t('signInTitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm
              locale={locale}
              translations={translations}
              callbackUrl={callbackUrl}
            />
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-sm">
          {translations.followTerms}{' '}
          <Link
            href={`/${locale}/terms-of-service`}
            className="hover:text-foreground underline"
          >
            {translations.tos}
          </Link>{' '}
          and{' '}
          <Link
            href={`/${locale}/privacy-policy`}
            className="hover:text-foreground underline"
          >
            {translations.pp}
          </Link>
        </p>
        <p className="text-center">{t('copyright')}</p>
      </div>
    </div>
  );
};

export default LoginRenderBlock;
