import { Metadata } from 'next';
import { typographyVariants } from '@/components/common/typography';
import {
  fontArchivoBlack,
  fontManrope,
  fontMontserrat,
  fontRoboto,
  fontSans,
} from '@/libs/fonts';
import { cn } from '@/libs/utils';
import { Providers } from '@/providers';
import { getMessages } from 'next-intl/server';
import { i18n, LocaleProps } from '@/i18n/config';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { getStaticParams, setStaticParamsLocale } from '@/i18n/server';
import { NextIntlClientProvider } from 'next-intl';
import '@/styles/globals.css';
import { getServerLocale } from '@/libs/server/utils';
import { NavigationProgress } from '@/components/common/navigation-progress';
import { Analytics } from '@vercel/analytics/next';

interface LocaleLayoutProps extends PropsWithChildren {
  params: Promise<{ locale: string }>;
  modal?: React.ReactNode; // Parallel route slot
}

interface MetaData {
  title: string;
  description: string;
  keywords: string[];
  siteName: string;
  author: string;
  creator: string;
}

export const generateStaticParams = () => {
  return getStaticParams();
};

function isValidLocale(locale: string): locale is LocaleProps {
  return i18n.locales.includes(locale as LocaleProps);
}

async function getMetadata(locale: string): Promise<MetaData> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/meta/${locale}.json`,
      { cache: 'force-cache' },
    );
    if (!response.ok) throw new Error('Failed to fetch metadata');
    return await response.json();
  } catch (error) {
    return {
      title: 'Anvel - Share & Discover Code Snippets',
      description:
        'Platform for developers to share and discover code snippets',
      keywords: ['code snippets', 'programming', 'developer tools'],
      siteName: 'Anvel',
      author: 'An Nguyen',
      creator: 'Nguyen Van An',
    };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!locale || !isValidLocale(locale)) {
    return {
      title: 'Anvel',
      description: 'Share & Discover Code Snippets',
    };
  }

  const metaData = await getMetadata(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: metaData.title,
      template: `%s | ${metaData.siteName}`,
    },
    description: metaData.description,
    keywords: metaData.keywords,
    authors: [{ name: metaData.author }],
    creator: metaData.creator,
    publisher: metaData.siteName,
    applicationName: metaData.siteName,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        vi: `${baseUrl}/vi`,
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      url: `${baseUrl}/${locale}`,
      siteName: metaData.siteName,
      title: metaData.title,
      description: metaData.description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: metaData.siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaData.title,
      description: metaData.description,
      creator: '@anvel',
      images: ['/twitter-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
        { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    manifest: '/manifest.json',
    verification: {
      google: 'google-code-at-google-console',
    },
  };
}

const LocaleLayout = async (props: LocaleLayoutProps) => {
  const params = await props.params;
  const { locale } = params;

  if (!locale || !isValidLocale(locale)) {
    notFound();
  }

  const validLocale = locale as LocaleProps;

  setStaticParamsLocale(validLocale);

  const messages = await getMessages();
  const serverLocale = await getServerLocale();

  return (
    <html lang={locale} suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
      </head>

      <body
        suppressHydrationWarning
        className={cn(
          fontSans.variable,
          fontManrope.variable,
          fontArchivoBlack.variable,
          fontMontserrat.variable,
          fontRoboto.variable,
          'font-Manrope relative antialiased',
          'bg-background text-foreground',
          typographyVariants({ variant: 'body' }),
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <NavigationProgress />
          <Providers locale={serverLocale}>
            {props.children}
            {props.modal}
          </Providers>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
};

export default LocaleLayout;
