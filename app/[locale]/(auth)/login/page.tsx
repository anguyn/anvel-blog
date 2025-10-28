import LoginRenderBlock from '@/components/blocks/pages/login/render';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';

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
    title: t.login.title || 'Login',
    description: t.login.pageDescription || 'Please login to your account',
    keywords: 'login, signin, authentication',
  };
}

const LoginPage = async (props: PageProps) => {
  const params = await props.params;
  const { locale } = params;

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const loginFormTranslations = {
    signInTitle: t.login.signInTitle,
    welcomeBack: t.login.welcomeBack,
    subTitle: t.login.subTitle,
    email: t.login.email,
    emailPlaceholder: t.login.emailPlaceholder,
    password: t.login.password,
    passwordPlaceholder: t.login.passwordPlaceholder,
    forgotPassword: t.login.forgotPassword,
    signIn: t.login.title,
    dontHaveAccount: t.login.dontHaveAccount,
    signUp: t.login.signUp,
    invalidCredentials: t.login.invalidCredentials,
    loginSuccess: t.login.loginSuccess,
    somethingWentWrong: t.login.somethingWentWrong,
    invalidEmail: t.login.invalidEmail,
    passwordMinLength: t.login.passwordMinLength,
    followTerms: t.login.followTerms,
    tos: t.login.tos,
    pp: t.login.pp,
    orContinueWith: t.login.orContinueWith,
    rememberMe: t.login.rememberMe,
    accountNotVerified: t.login.accountNotVerified,
    accountNotVerifiedMessage: t.login.accountNotVerifiedMessage,
    accountSuspended: t.login.accountSuspended,
    accountSuspendedMessage: t.login.accountSuspendedMessage,
    accountBanned: t.login.accountBanned,
    accountBannedMessage: t.login.accountBannedMessage,
    resendVerification: t.login.resendVerification,
    resending: t.login.resending,
  };

  return <LoginRenderBlock translations={loginFormTranslations} />;
};

export default LoginPage;
