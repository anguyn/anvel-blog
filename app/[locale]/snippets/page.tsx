import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';
import { SnippetsRenderBlock } from '@/components/blocks/pages/snippets/render';
import { Snippet, PaginationMeta } from '@/types';

export const generateStaticParams = getStaticParams;

async function getSnippets(searchParams: {
  page?: string;
  language?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  limit?: string;
}): Promise<{ snippets: Snippet[]; pagination: PaginationMeta }> {
  try {
    const params = new URLSearchParams();
    if (searchParams.page) params.set('page', searchParams.page);
    if (searchParams.language) params.set('language', searchParams.language);
    if (searchParams.tag) params.set('tag', searchParams.tag);
    if (searchParams.search) params.set('search', searchParams.search);
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
    console.error('Failed to fetch snippets:', error);
    return {
      snippets: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }
}

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
    title: t.snippets.title || 'Browse Code Snippets',
    description:
      t.snippets.pageDescription ||
      'Discover and explore code snippets from developers worldwide',
    keywords: 'code snippets, browse, search, programming languages',
  };
}

export default async function SnippetsPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { locale } = params;

  setStaticParamsLocale(locale);
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

  const { snippets, pagination } = await getSnippets({
    page: normalizeParam(searchParams?.page),
    language: normalizeParam(searchParams?.language),
    tag: normalizeParam(searchParams?.tag),
    search: normalizeParam(searchParams?.search),
    sortBy: normalizeParam(searchParams?.sortBy),
  });

  const snippetsTranslations = {
    allSnippets: t.snippets.allSnippets || 'All Snippets',
    searchResults: t.snippets.searchResults || 'Search Results',
    snippetsFound: t.snippets.snippetsFound || 'snippets found',
    snippetFound: t.snippets.snippetFound || 'snippet found',
    mostRecent: t.snippets.mostRecent || 'Most Recent',
    mostViewed: t.snippets.mostViewed || 'Most Viewed',
    mostLiked: t.snippets.mostLiked || 'Most Liked',
    language: t.snippets.language || 'Language',
    tag: t.snippets.tag || 'Tag',
    search: t.snippets.search || 'Search',
    noSnippetsFound:
      t.snippets.noSnippetsFound ||
      'No snippets found. Try adjusting your filters.',
    previous: t.common.previous || 'Previous',
    next: t.common.next || 'Next',
  };

  return (
    <MainLayout locale={locale as string}>
      <SnippetsRenderBlock
        locale={locale as string}
        translations={snippetsTranslations}
        snippets={snippets}
        pagination={pagination}
        searchParams={{
          page: normalizeParam(searchParams?.page),
          language: normalizeParam(searchParams?.language),
          tag: normalizeParam(searchParams?.tag),
          search: normalizeParam(searchParams?.search),
          sortBy: normalizeParam(searchParams?.sortBy),
        }}
      />
    </MainLayout>
  );
}
