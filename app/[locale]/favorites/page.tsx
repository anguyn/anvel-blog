import { cookies } from 'next/headers';
import { formatCookies, serverFetch } from '@/libs/utils';
import { MainLayout } from '@/components/layouts/main-layout';
import { Snippet, PaginationMeta } from '@/types';
import { redirect } from 'next/navigation';
import { auth } from '@/libs/server/auth';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';
import { FavoritesRenderBlock } from '@/components/blocks/pages/favorites/render';

export const generateStaticParams = getStaticParams;

async function getFavorites(
  userId: string,
  cookieHeader: string,
  searchParams: { page?: string; limit?: string },
): Promise<{ favorites: Snippet[]; pagination: PaginationMeta }> {
  try {
    const params = new URLSearchParams();
    if (searchParams.page) params.set('page', searchParams.page);
    params.set('limit', searchParams.limit || '10');

    const res = await serverFetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/users/me/favorites?${params.toString()}`,
      cookieHeader,
      { cache: 'no-store' },
    );

    if (!res.ok) {
      return {
        favorites: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return {
      favorites: [],
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
    title: t.favorites.title || 'My Favorites',
    description: t.favorites.pageDescription || 'Your saved code snippets',
    keywords: 'favorites, saved snippets, bookmarks',
  };
}

export default async function FavoritesPage(props: PageProps) {
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

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/favorites`);
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = formatCookies(allCookies);

  const normalizeParam = (
    param: string | string[] | undefined,
  ): string | undefined => {
    if (Array.isArray(param)) return param[0];
    return param;
  };

  const { favorites, pagination } = await getFavorites(
    session.user.id,
    cookieHeader,
    {
      page: normalizeParam(searchParams?.page),
    },
  );

  const favoritesTranslations = {
    title: t.favorites.title,
    savedSnippet: t.favorites.savedSnippet,
    pluralSuffix: t.favorites.pluralSuffix,
    noFavoritesYet: t.favorites.noFavoritesYet,
    noFavoritesDescription: t.favorites.noFavoritesDescription,
    previous: t.common.previous || 'Previous',
    next: t.common.next || 'Next',
  };

  return (
    <MainLayout locale={locale as string}>
      <FavoritesRenderBlock
        favorites={favorites}
        pagination={pagination}
        translations={favoritesTranslations}
        locale={locale as string}
        searchParams={{
          page: normalizeParam(searchParams?.page),
        }}
      />
    </MainLayout>
  );
}
