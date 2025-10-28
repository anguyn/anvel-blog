import VerifyEmailBlock from '@/components/blocks/pages/verify-email/render';
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
  const { locale } = params;
  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();
  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };
  const t = await translate(dictionaries);

  return {
    title: t.auth.verifyEmail.title || 'Verify Email',
    description: t.auth.verifyEmail.description || 'Verify your email address',
  };
}

export default async function VerifyEmailPage(props: PageProps) {
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

  const translations = {
    title: t.auth.verifyEmail.title,
    verifying: t.auth.verifyEmail.verifying,
    verifyingDescription: t.auth.verifyEmail.verifyingDescription,
    redirectingLogin: t.auth.verifyEmail.redirectingLogin,
    success: t.auth.verifyEmail.success,
    successMessage: t.auth.verifyEmail.successMessage,
    error: t.auth.verifyEmail.error,
    expired: t.auth.verifyEmail.expired,
    expiredMessage: t.auth.verifyEmail.expiredMessage,
    invalidToken: t.auth.verifyEmail.invalidToken,
    alreadyVerified: t.auth.verifyEmail.alreadyVerified,
    resendEmail: t.auth.verifyEmail.resendEmail,
    resending: t.auth.verifyEmail.resending,
    resendSuccess: t.auth.verifyEmail.resendSuccess,
    resendError: t.auth.verifyEmail.resendError,
    rateLimitError: t.auth.verifyEmail.rateLimitError,
    waitBeforeResend: t.auth.verifyEmail.waitBeforeResend,
    goToLogin: t.auth.verifyEmail.goToLogin,
  };

  return (
    <VerifyEmailBlock locale={locale as string} translations={translations} />
  );
}
