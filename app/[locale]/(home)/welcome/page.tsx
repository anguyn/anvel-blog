import { WelcomeRenderBlock } from '@/components/blocks/pages/home/welcome';
import {
  getStaticParams,
  getTranslate,
  setStaticParamsLocale,
} from '@/i18n/server';
import { getCurrentUser } from '@/libs/server/rbac';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const generateStaticParams = getStaticParams;

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const user = await getCurrentUser();

  if (!user) {
    redirect('/not-found'); // replace
  }

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  return {
    title: t.home.title,
    description: t.home.pageDescription,
    keywords:
      'code snippets, programming, collaboration, developer community, technical blog, AI code analysis',
    openGraph: {
      title: t.home.title,
      description: t.home.pageDescription,
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.home.title,
      description: t.home.pageDescription,
    },
  };
}

export default async function WelcomePage(props: PageProps) {
  const params = await props.params;
  const { locale } = params;

  setStaticParamsLocale(locale);

  return <WelcomeRenderBlock locale={locale as string} />;
}
