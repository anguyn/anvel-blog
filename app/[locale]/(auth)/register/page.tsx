import RegisterRenderBlock from '@/components/blocks/pages/register/render';
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
    title: t.register.title || 'Register',
    description: t.register.pageDescription || 'Create your account',
    keywords: 'register, signup, create account, authentication',
  };
}

const RegisterPage = async (props: PageProps) => {
  const params = await props.params;
  const { locale } = params;

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const registerFormTranslations = {
    pageDescription: t.register.pageDescription,
    subTitle: t.register.subTitle,
    name: t.register.name,
    namePlaceholder: t.register.namePlaceholder,
    email: t.register.email,
    emailPlaceholder: t.register.emailPlaceholder,
    password: t.register.password,
    passwordPlaceholder: t.register.passwordPlaceholder,
    confirmPassword: t.register.confirmPassword,
    confirmPasswordPlaceholder: t.register.confirmPasswordPlaceholder,
    createAccount: t.register.createAccount,
    signUpTitle: t.register.signUpTitle,
    alreadyHaveAccount: t.register.alreadyHaveAccount,
    signIn: t.register.signIn,
    nameMinLength: t.register.nameMinLength,
    invalidEmail: t.register.invalidEmail,
    passwordMinLength: t.register.passwordMinLength,
    passwordsDontMatch: t.register.passwordsDontMatch,
    registrationFailed: t.register.registrationFailed,
    accountCreatedSuccess: t.register.accountCreatedSuccess,
    somethingWentWrong: t.register.somethingWentWrong,
    followTerms: t.register.followTerms,
    tos: t.register.tos,
    pp: t.register.pp,
    passwordRequirements: t.register.passwordRequirements,
    requirement8Chars: t.register.requirement8Chars,
    requirementUppercase: t.register.requirementUppercase,
    requirementLowercase: t.register.requirementLowercase,
    requirementNumber: t.register.requirementNumber,
    requirementSpecial: t.register.requirementSpecial,
    verificationEmailSent: t.register.verificationEmailSent,
    verificationEmailSentMessage: t.register.verificationEmailSentMessage,
    checkYourEmail: t.register.checkYourEmail,
    resendVerificationEmail: t.register.resendVerificationEmail,
    resending: t.register.resending,
    closeDialog: t.register.closeDialog,
    resendIn: t.auth.forgotPassword.resendIn,
  };

  return <RegisterRenderBlock translations={registerFormTranslations} />;
};

export default RegisterPage;
