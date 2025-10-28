import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';
import { TagDetailRenderBlock } from '@/components/blocks/pages/tags/detail/render';
import { Tag, Snippet, PaginationMeta } from '@/types';
import { notFound } from 'next/navigation';
import { LocaleProps } from '@/i18n/config';

export const dynamic = 'force-dynamic';

export const generateStaticParams = getStaticParams;

async function getTag(slug: string): Promise<Tag | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tags`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const tags: Tag[] = await res.json();
    return tags.find(t => t.slug === slug) || null;
  } catch (error) {
    console.error('Failed to fetch tag:', error);
    return null;
  }
}

async function getSnippetsByTag(
  tagSlug: string,
  searchParams: {
    page?: string;
    sortBy?: string;
    limit?: string;
  },
): Promise<{ snippets: Snippet[]; pagination: PaginationMeta }> {
  try {
    const params = new URLSearchParams();
    params.set('tag', tagSlug);
    if (searchParams.page) params.set('page', searchParams.page);
    if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy);

    params.set('limit', searchParams.limit || '10');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/snippets?${params.toString()}`,
      { cache: 'no-store' },
    );

    if (!res.ok) {
      return {
        snippets: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch snippets by tag:', error);
    return {
      snippets: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }
}

interface TagDetailPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams?: Promise<{
    page?: string;
    sortBy?: string;
    limit?: string;
  }>;
}

export async function generateMetadata({
  params,
}: TagDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const tag = await getTag(slug);

  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  if (!tag) {
    return {
      title: t.tags.notFound || 'Tag Not Found',
    };
  }

  return {
    title: `${tag.name} - ${t.tags.browseSnippets || 'Browse Snippets'}`,
    description: `${t.tags.explore || 'Explore'} ${tag._count?.snippets || 0} ${t.tags.codeSnippetsTagged || 'code snippets tagged with'} ${tag.name}`,
  };
}

export default async function TagDetailPage({
  params,
  searchParams,
}: TagDetailPageProps) {
  const { locale, slug } = await params;
  const resolvedSearchParams = await searchParams;

  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const normalizeParam = (
    param: string | string[] | undefined,
  ): string | undefined => {
    if (Array.isArray(param)) return param[0];
    return param;
  };

  const [tag, { snippets, pagination }] = await Promise.all([
    getTag(slug),
    getSnippetsByTag(slug, {
      page: normalizeParam(resolvedSearchParams?.page),
      sortBy: normalizeParam(resolvedSearchParams?.sortBy),
      limit: normalizeParam(resolvedSearchParams?.limit),
    }),
  ]);

  if (!tag) {
    notFound();
  }

  const tagDetailTranslations = {
    language: t.tags.language || 'Language',
    topic: t.tags.topic || 'Topic',
    snippet: t.tags.snippet || 'snippet',
    snippets: t.tags.snippets || 'snippets',
    found: t.tags.found || 'found',
    noSnippetsFound:
      t.tags.noSnippetsFound || 'No snippets found for this tag yet.',
    mostRecent: t.snippets.mostRecent || 'Most Recent',
    mostViewed: t.snippets.mostViewed || 'Most Viewed',
    mostLiked: t.snippets.mostLiked || 'Most Liked',
    previous: t.common.previous || 'Previous',
    next: t.common.next || 'Next',
  };

  return (
    <MainLayout locale={locale as string}>
      <TagDetailRenderBlock
        locale={locale as string}
        translations={tagDetailTranslations}
        tag={tag}
        snippets={snippets}
        pagination={pagination}
        searchParams={{
          page: normalizeParam(resolvedSearchParams?.page),
          sortBy: normalizeParam(resolvedSearchParams?.sortBy),
          limit: normalizeParam(resolvedSearchParams?.limit),
        }}
      />
    </MainLayout>
  );
}
