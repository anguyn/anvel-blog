import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PrivacyPolicyRender } from '@/components/blocks/pages/legal/privacy-render';
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
    title: t.contact.title,
    description: t.contact.pageDescription,
  };
}

export default async function PrivacyPolicyPage(props: PageProps) {
  const params = await props.params;
  const { locale } = params;

  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  setStaticParamsLocale(locale);

  const privacyTranslation = {
    heroTitle: t.privacy.heroTitle,
    heroSubtitle: t.privacy.heroSubtitle,
    lastUpdated: t.privacy.lastUpdated,
    infoCollectTitle: t.privacy.infoCollectTitle,
    infoCollectDesc: t.privacy.infoCollectDesc,
    infoItem1: t.privacy.infoItem1,
    infoItem2: t.privacy.infoItem2,
    infoItem3: t.privacy.infoItem3,
    infoItem4: t.privacy.infoItem4,
    infoItem5: t.privacy.infoItem5,
    howUseTitle: t.privacy.howUseTitle,
    howUseDesc: t.privacy.howUseDesc,
    useItem1: t.privacy.useItem1,
    useItem2: t.privacy.useItem2,
    useItem3: t.privacy.useItem3,
    useItem4: t.privacy.useItem4,
    useItem5: t.privacy.useItem5,
    sharingTitle: t.privacy.sharingTitle,
    sharingDesc: t.privacy.sharingDesc,
    shareItem1: t.privacy.shareItem1,
    shareItem2: t.privacy.shareItem2,
    shareItem3: t.privacy.shareItem3,
    shareItem4: t.privacy.shareItem4,
    securityTitle: t.privacy.securityTitle,
    securityDesc: t.privacy.securityDesc,
    rightsTitle: t.privacy.rightsTitle,
    rightsDesc: t.privacy.rightsDesc,
    rightItem1: t.privacy.rightItem1,
    rightItem2: t.privacy.rightItem2,
    rightItem3: t.privacy.rightItem3,
    rightItem4: t.privacy.rightItem4,
    rightItem5: t.privacy.rightItem5,
    contactTitle: t.privacy.contactTitle,
    contactDesc: t.privacy.contactDesc,
    contactEmail: t.privacy.contactEmail,
  };

  return (
    <MainLayout locale={locale as string}>
      <div className="container mx-auto px-4 py-14">
        <PrivacyPolicyRender translations={privacyTranslation} />
      </div>
    </MainLayout>
  );
}
