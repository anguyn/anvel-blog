import ResetPasswordBlock from '@/components/blocks/pages/reset-password/render';
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
    title: t.auth.resetPassword.title || 'Reset Password',
    description: t.auth.resetPassword.description || 'Create a new password',
  };
}

export default async function ResetPasswordPage(props: PageProps) {
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
    title: t.auth.resetPassword.title,
    subtitle: t.auth.resetPassword.subtitle,
    password: t.auth.resetPassword.password,
    passwordPlaceholder: t.auth.resetPassword.passwordPlaceholder,
    confirmPassword: t.auth.resetPassword.confirmPassword,
    confirmPasswordPlaceholder: t.auth.resetPassword.confirmPasswordPlaceholder,
    resetPassword: t.auth.resetPassword.resetPassword,
    resetting: t.auth.resetPassword.resetting,
    success: t.auth.resetPassword.success,
    successMessage: t.auth.resetPassword.successMessage,
    error: t.auth.resetPassword.error,
    expired: t.auth.resetPassword.expired,
    expiredMessage: t.auth.resetPassword.expiredMessage,
    invalidToken: t.auth.resetPassword.invalidToken,
    passwordTooWeak: t.auth.resetPassword.passwordTooWeak,
    passwordsDontMatch: t.auth.resetPassword.passwordsDontMatch,
    goToLogin: t.auth.resetPassword.goToLogin,
    expiresIn: t.auth.resetPassword.expiresIn,
    passwordRequirements: t.auth.resetPassword.passwordRequirements,
    requirement8Chars: t.auth.resetPassword.requirement8Chars,
    requirementUppercase: t.auth.resetPassword.requirementUppercase,
    requirementLowercase: t.auth.resetPassword.requirementLowercase,
    requirementNumber: t.auth.resetPassword.requirementNumber,
    requirementSpecial: t.auth.resetPassword.requirementSpecial,
    invalidLink: t.auth.resetPassword.invalidLink,
    redirectingLogin: t.auth.resetPassword.redirectingLogin,
    requestNewLink: t.auth.resetPassword.requestNewLink,
    requestNewLinkDes: t.auth.resetPassword.requestNewLinkDes,
  };

  return (
    <ResetPasswordBlock locale={locale as string} translations={translations} />
  );
}
