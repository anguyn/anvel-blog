'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Code2 } from 'lucide-react';
import Link from 'next/link';
import { RegisterForm } from './register-form';
import { useLocale } from '@/libs/hooks/use-locale';
import { ThemeLocaleControls } from '@/components/common/theme-locale-control';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface RegisterFormTranslations {
  pageDescription: string;
  subTitle: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  createAccount: string;
  signUpTitle: string;
  alreadyHaveAccount: string;
  signIn: string;
  nameMinLength: string;
  invalidEmail: string;
  passwordMinLength: string;
  passwordsDontMatch: string;
  registrationFailed: string;
  accountCreatedSuccess: string;
  somethingWentWrong: string;
  followTerms: string;
  tos: string;
  pp: string;
  passwordRequirements: string;
  requirement8Chars: string;
  requirementUppercase: string;
  requirementLowercase: string;
  requirementNumber: string;
  requirementSpecial: string;
  verificationEmailSent: string;
  verificationEmailSentMessage: string;
  checkYourEmail: string;
  resendVerificationEmail: string;
  resending: string;
  closeDialog: string;
  resendIn: string;
}

interface RegisterRenderBlockProps {
  translations: RegisterFormTranslations;
}

const RegisterRenderBlock = ({ translations }: RegisterRenderBlockProps) => {
  const { locale } = useLocale();
  const t = useTranslations('register');

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
            <p className="text-muted-foreground">{translations.subTitle}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{translations.pageDescription}</CardTitle>
              <CardDescription>{translations.signUpTitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm locale={locale} translations={translations} />
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-center text-sm">
            {translations.followTerms}{' '}
            <Link
              href={`/${locale}/terms-of-service`}
              prefetch
              className="hover:text-foreground underline"
            >
              {translations.tos}
            </Link>{' '}
            and{' '}
            <Link
              href={`/${locale}/privacy-policy`}
              prefetch
              className="hover:text-foreground underline"
            >
              {translations.pp}
            </Link>
          </p>
          <p className="text-center">{t('copyright')}</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterRenderBlock;
