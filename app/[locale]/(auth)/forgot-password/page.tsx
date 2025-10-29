import ForgotPasswordBlock from '@/components/blocks/pages/forgot-password/render';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { auth } from '@/libs/server/auth';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const generateStaticParams = getStaticParams;

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { locale } = params;

  const session = await auth();

  if (session?.user) {
    const callbackUrl = searchParams?.callbackUrl;

    if (callbackUrl && typeof callbackUrl === 'string') {
      if (callbackUrl.startsWith('/')) {
        redirect(callbackUrl);
      }
    }

    redirect(`/${locale}`);
  }

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  return {
    title: t.auth.forgotPassword.title || 'Forgot Password',
    description: t.auth.forgotPassword.description || 'Reset your password',
  };
}

export default async function ForgotPasswordPage(props: PageProps) {
  const params = await props.params;
  const { locale } = params;
  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();
  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };
  const t = await translate(dictionaries);

  const translations = {
    title: t.auth.forgotPassword.title,
    subtitle: t.auth.forgotPassword.subtitle,
    email: t.auth.forgotPassword.email,
    emailPlaceholder: t.auth.forgotPassword.emailPlaceholder,
    sendResetLink: t.auth.forgotPassword.sendResetLink,
    sending: t.auth.forgotPassword.sending,
    success: t.auth.forgotPassword.success,
    successMessage: t.auth.forgotPassword.successMessage,
    error: t.auth.forgotPassword.error,
    invalidEmail: t.auth.forgotPassword.invalidEmail,
    backToLogin: t.auth.forgotPassword.backToLogin,
    resendIn: t.auth.forgotPassword.resendIn,
    canResendNow: t.auth.forgotPassword.canResendNow,
    resetLinkExprire: t.auth.forgotPassword.resetLinkExprire,
  };

  return (
    <ForgotPasswordBlock
      locale={locale as string}
      translations={translations}
    />
  );
}
