import { Header } from './default-header/header';
import { Footer } from './footer';
import { getTranslate } from '@/i18n/server';
import { ScrollToTop } from '@/components/common/scroll-to-top';
import { CookieConsent } from '@/components/common/cookie-consent';

interface MainLayoutProps {
  children: React.ReactNode;
  locale: string;
}

export async function MainLayout({ children, locale }: MainLayoutProps) {
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const headerTranslations = {
    explore: t.common?.explore || 'Explore',
    snippets: t.common?.snippets || 'Snippets',
    blog: t.common?.blog || 'Blog',
    tags: t.common?.tags || 'Tags',
    about: t.common?.about || 'About',
    search: t.common?.search || 'Search...',
    create: t.common?.create || 'Create',
  };

  const footerTranslations = {
    description:
      t.common?.description ||
      'Share, discover, and collaborate on code snippets with developers worldwide.',
    product: t.common?.product || 'Product',
    blog: t.common?.blog || 'Blog',
    snippets: t.common?.snippets || 'Snippets',
    createSnippet: t.common?.createSnippet || 'Create Snippet',
    tags: t.common?.tags || 'Tags',
    about: t.common?.about || 'About',
    contact: t.common?.contact || 'Contact',
    legal: t.common?.legal || 'Legal',
    company: t.common?.company || 'Company',
    privacy: t.common?.privacy || 'Privacy Policy',
    terms: t.common?.terms || 'Terms of Service',
    cookiePolicy: t.common?.cookiePolicy || 'Cookie Policy',
    copyright: t.common?.copyright || 'All rights reserved.',
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <main className="mt-16 flex-1">{children}</main>
      <Footer locale={locale} translations={footerTranslations} />
      <ScrollToTop />
      <CookieConsent locale={locale} />
    </div>
  );
}
