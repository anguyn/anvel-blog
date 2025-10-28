import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { ContactRender } from '@/components/blocks/pages/contact/render';
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

export default async function ContactPage(props: PageProps) {
  const params = await props.params;
  const { locale } = params;

  setStaticParamsLocale(locale);

  return (
    <MainLayout locale={locale as string}>
      <div className="container mx-auto px-4 py-14">
        <ContactRender locale={locale as string} />
      </div>
    </MainLayout>
  );
}
