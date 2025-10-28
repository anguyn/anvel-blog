import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';
import { HomeRenderBlock } from '@/components/blocks/pages/home/render';
import { Newsletter } from '@/components/blocks/newsletter';

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

export default async function HomePage(props: PageProps) {
  const params = await props.params;
  const { locale } = params;

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const homeTranslations = {
    badge: t.home.badge,
    heroTitle: t.home.heroTitle,
    heroTitleHighlight: t.home.heroTitleHighlight,
    heroDescription: t.home.heroDescription,
    createSnippet: t.home.createSnippet,
    exploreSnippets: t.home.exploreSnippets,
    readBlog: t.home.readBlog,
    scrollDown: t.home.scrollDown,

    featuresTitle: t.home.featuresTitle,
    featuresSubtitle: t.home.featuresSubtitle,
    codeSnippetsTitle: t.home.codeSnippetsTitle,
    codeSnippetsDesc: t.home.codeSnippetsDesc,
    personalBlogTitle: t.home.personalBlogTitle,
    personalBlogDesc: t.home.personalBlogDesc,
    communityTitle: t.home.communityTitle,
    communityDesc: t.home.communityDesc,
    instantAnalysisTitle: t.home.instantAnalysisTitle,
    instantAnalysisDesc: t.home.instantAnalysisDesc,

    howItWorksTitle: t.home.howItWorksTitle,
    howItWorksSubtitle: t.home.howItWorksSubtitle,
    step1Title: t.home.step1Title,
    step1Desc: t.home.step1Desc,
    step2Title: t.home.step2Title,
    step2Desc: t.home.step2Desc,
    step3Title: t.home.step3Title,
    step3Desc: t.home.step3Desc,

    statsTitle: t.home.statsTitle,
    snippetsCount: t.home.snippetsCount,
    usersCount: t.home.usersCount,
    articlesCount: t.home.articlesCount,

    testimonialTitle: t.home.testimonialTitle,
    testimonialQuote: t.home.testimonialQuote,
    testimonialAuthor: t.home.testimonialAuthor,
    testimonialRole: t.home.testimonialRole,

    ctaTitle: t.home.ctaTitle,
    ctaDescription: t.home.ctaDescription,
    getStarted: t.home.getStarted,
  };

  const newsletterTranslations = {
    title: t.newsletter.title,
    description: t.newsletter.description,
    emailPlaceholder: t.newsletter.emailPlaceholder,
    subscribe: t.newsletter.subscribe,
    subscribing: t.newsletter.subscribing,
    subscribed: t.newsletter.subscribed,
    invalidEmail: t.newsletter.invalidEmail,
    successMessage: t.newsletter.successMessage,
    errorMessage: t.newsletter.errorMessage,
    privacy: t.newsletter.privacy,
    feature1: t.newsletter.feature1,
    feature2: t.newsletter.feature2,
    feature3: t.newsletter.feature3,
  };

  return (
    <MainLayout locale={locale as string}>
      <HomeRenderBlock
        locale={locale as string}
        translations={homeTranslations}
      />
      <Newsletter
        locale={locale as string}
        translations={newsletterTranslations}
      />
    </MainLayout>
  );
}
