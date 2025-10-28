import { cookies } from 'next/headers';
import { formatCookies, serverFetch } from '@/libs/utils';
import { MainLayout } from '@/components/layouts/main-layout';
import { SearchResults } from '@/types';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SearchRenderBlock } from '@/components/blocks/pages/search/render';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { LocaleProps } from '@/i18n/config';

export const generateStaticParams = getStaticParams;

async function searchAll(
  query: string,
  cookieHeader: string,
): Promise<SearchResults> {
  try {
    const res = await serverFetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/search?q=${encodeURIComponent(query)}`,
      cookieHeader,
      { cache: 'no-store' },
    );
    if (!res.ok) {
      return { snippets: [], tags: [], users: [] };
    }
    return await res.json();
  } catch (error) {
    console.error('Search error:', error);
    return { snippets: [], tags: [], users: [] };
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { q, type } = await searchParams;

  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  return {
    title: q
      ? `${t.search.searchResults || 'Search Results'} - ${q}`
      : t.search.search || 'Search',
    description:
      t.search.description || 'Search for code snippets, tags, and developers',
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { locale } = await params;
  const { q, type } = await searchParams;

  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  if (q !== undefined && q.trim() === '') {
    notFound();
  }

  const query = q || '';
  const searchType = type || 'all';

  const cookieStore = await cookies();
  const cookieHeader = formatCookies(cookieStore.getAll());

  const results = query
    ? await searchAll(query, cookieHeader)
    : { snippets: [], tags: [], users: [] };

  const searchTranslations = {
    searchResults: t.search.searchResults || 'Search Results',
    foundResults: t.search.foundResults || 'Found',
    result: t.search.result || 'result',
    results: t.search.results || 'results',
    for: t.search.for || 'for',
    all: t.search.all || 'All',
    snippets: t.search.snippets || 'Snippets',
    tags: t.search.tags || 'Tags',
    users: t.search.users || 'Users',
    enterSearchQuery:
      t.search.enterSearchQuery ||
      'Enter a search query to find snippets, tags, and users',
    noResultsFound: t.search.noResultsFound || 'No results found for',
    snippetsCount: t.search.snippetsCount || 'snippets',
  };

  return (
    <MainLayout locale={locale}>
      <SearchRenderBlock
        results={results}
        query={query}
        type={searchType}
        locale={locale}
        translations={searchTranslations}
      />
    </MainLayout>
  );
}
