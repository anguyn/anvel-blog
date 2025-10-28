import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';
import { AboutRender } from '@/components/blocks/pages/about/render';

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
    title: t.about.title,
    description: t.about.pageDescription,
  };
}

export default async function AboutPage(props: PageProps) {
  const params = await props.params;
  const { locale } = params;

  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  setStaticParamsLocale(locale);

  const aboutTranslations = {
    heroTitle: t.about.heroTitle,
    heroSubtitle: t.about.heroSubtitle,
    storyTitle: t.about.storyTitle,
    storySubtitle: t.about.storySubtitle,
    storyP1: t.about.storyP1,
    storyP2: t.about.storyP2,
    storyP3: t.about.storyP3,
    missionTitle: t.about.missionTitle,
    missionDesc: t.about.missionDesc,
    visionTitle: t.about.visionTitle,
    visionDesc: t.about.visionDesc,
    valuesTitle: t.about.valuesTitle,
    valuesDesc: t.about.valuesDesc,
    creatorTitle: t.about.creatorTitle,
    creatorName: t.about.creatorName,
    creatorRole: t.about.creatorRole,
    creatorBio: t.about.creatorBio,
    github: t.about.github,
    linkedin: t.about.linkedin,
    contactMe: t.about.contactMe,
    techTitle: t.about.techTitle,
    techSubtitle: t.about.techSubtitle,
    ctaTitle: t.about.ctaTitle,
    ctaSubtitle: t.about.ctaSubtitle,
    getStarted: t.about.getStarted,
    contactUs: t.about.contactUs,
  };

  return (
    <MainLayout locale={locale as string}>
      <div className="container mx-auto px-4 py-14">
        <AboutRender
          locale={locale as string}
          translations={aboutTranslations}
        />
      </div>
    </MainLayout>
  );
}
