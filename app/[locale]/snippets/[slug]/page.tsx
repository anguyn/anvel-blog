import { cookies } from 'next/headers';
import { formatCookies, serverFetch } from '@/libs/utils';
import { MainLayout } from '@/components/layouts/main-layout';
import { Snippet } from '@/types';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SnippetViewBlock } from '@/components/blocks/pages/snippets/view/render';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { auth } from '@/libs/server/auth';

export const dynamic = 'force-dynamic';

export const generateStaticParams = getStaticParams;

async function getSnippet(
  slug: string,
  cookieHeader: string,
): Promise<Snippet | null> {
  try {
    const res = await serverFetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/snippets/${slug}`,
      cookieHeader,
      { cache: 'no-store' },
    );

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch snippet:', error);
    return null;
  }
}

async function checkIsFavorited(
  snippetId: string,
  cookieHeader: string,
): Promise<boolean> {
  try {
    const res = await serverFetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/snippets/${snippetId}/favorite/check`,
      cookieHeader,
      { cache: 'no-store' },
    );

    if (!res.ok) return false;
    const data = await res.json();
    return data.isFavorited || false;
  } catch (error) {
    return false;
  }
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale, slug } = await props.params;

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const cookieStore = await cookies();
  const cookieHeader = formatCookies(cookieStore.getAll());

  const snippet = await getSnippet(slug || '', cookieHeader);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const snippetUrl = `${baseUrl}/${locale}/snippets/${slug}`;

  if (!snippet) {
    return {
      title: t.snippets.notFound || 'Snippet Not Found',
      description: 'The requested code snippet could not be found.',
    };
  }

  const authorName = snippet.user.name || snippet.user.username || 'Anonymous';

  const codeExcerpt =
    snippet.code.length > 150
      ? snippet.code.substring(0, 150).trim() + '...'
      : snippet.code.trim();

  const detailedDescription = snippet.description
    ? `${snippet.description} | Code: ${codeExcerpt}`
    : `${snippet.language.name} code snippet by ${authorName}. ${snippet.complexity ? `Complexity: ${snippet.complexity}.` : ''} Code preview: ${codeExcerpt}`;

  const keywords = [
    snippet.language.name,
    'code snippet',
    'programming',
    ...snippet.tags.map(t => t.tag.name),
    authorName,
  ];

  if (snippet.complexity) {
    keywords.push(`${snippet.complexity} complexity`);
  }

  return {
    title: snippet.title,
    description: detailedDescription,
    keywords,
    authors: [
      {
        name: authorName,
        url: `${baseUrl}/${locale}/users/${snippet.user.username}`,
      },
    ],
    creator: authorName,
    publisher: 'Anvel',

    alternates: {
      canonical: snippetUrl,
      languages: {
        en: `${baseUrl}/en/snippets/${slug}`,
        vi: `${baseUrl}/vi/snippets/${slug}`,
      },
    },

    openGraph: {
      type: 'article',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      url: snippetUrl,
      siteName: 'Anvel',
      title: snippet.title,
      description: detailedDescription,

      authors: [authorName],
      publishedTime: new Date(snippet.createdAt).toISOString(),
      modifiedTime: new Date(
        snippet.updatedAt || snippet.createdAt,
      ).toISOString(),

      tags: snippet.tags.map(t => t.tag.name),

      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${snippet.title} - ${snippet.language.name} Code Snippet`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: snippet.title,
      description: detailedDescription,
      creator: '@anvel',
      images: ['/twitter-image.png'],
    },

    category: snippet.language.name,

    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },

    other: {
      'article:author': authorName,
      'article:published_time': new Date(snippet.createdAt).toISOString(),
      'article:modified_time': new Date(
        snippet.updatedAt || snippet.createdAt,
      ).toISOString(),
      'article:tag': snippet.tags.map(t => t.tag.name).join(','),

      'schema:type': 'SoftwareSourceCode',
      'schema:programmingLanguage': snippet.language.name,
      'schema:codeRepository': snippetUrl,
      'schema:author': authorName,
      'schema:codeSampleType': 'code snippet',
      'schema:description': detailedDescription,

      'code:language': snippet.language.name,
      'code:complexity': snippet.complexity || 'unknown',
    },
  };
}

export default async function SnippetDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const session = await auth();
  const cookieStore = await cookies();
  const cookieHeader = formatCookies(cookieStore.getAll());

  const snippet = await getSnippet(slug, cookieHeader);

  if (!snippet) {
    notFound();
  }

  const isFavorited = session
    ? await checkIsFavorited(snippet.id, cookieHeader)
    : false;

  const snippetTranslations = {
    share: t.common.share,
    save: t.common.save,
    saved: t.common.saved,
    edit: t.common.edit,
    delete: t.common.delete,
    views: t.common.views,
    saves: t.common.saves,
    code: t.common.code,
    timeComplexity: t.snippets.timeComplexity,
    estimatedComplexity: t.snippets.estimatedComplexity,
    complexityDisclaimer: t.snippets.complexityDisclaimer,
    aboutAuthor: t.snippets.aboutAuthor,
    viewProfile: t.snippets.viewProfile,
    loginToSave: t.snippets.loginToSave,
  };

  return (
    <MainLayout locale={locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareSourceCode',
            name: snippet.title,
            description:
              snippet.description || `${snippet.language.name} code snippet`,
            programmingLanguage: {
              '@type': 'ComputerLanguage',
              name: snippet.language.name,
            },
            codeRepository: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/snippets/${snippet.slug}`,
            codeSampleType: 'code snippet',

            author: {
              '@type': 'Person',
              name: snippet.user.name || snippet.user.username,
              url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/users/${snippet.user.username}`,
            },

            datePublished: new Date(snippet.createdAt).toISOString(),
            dateModified: new Date(
              snippet.updatedAt || snippet.createdAt,
            ).toISOString(),

            interactionStatistic: [
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/ViewAction',
                userInteractionCount: snippet.viewCount,
              },
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/LikeAction',
                userInteractionCount: snippet._count?.favorites || 0,
              },
            ],

            keywords: snippet.tags.map(t => t.tag.name).join(', '),

            ...(snippet.complexity && {
              runtimePlatform: `Time Complexity: ${snippet.complexity}`,
            }),
          }),
        }}
      />

      <SnippetViewBlock
        snippet={snippet}
        locale={locale}
        isFavorited={isFavorited}
        translations={snippetTranslations}
      />
    </MainLayout>
  );
}
