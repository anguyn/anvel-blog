import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';
import { BlogHeader } from '@/components/blocks/pages/blog/blog-header';
import { BlogFilters } from '@/components/blocks/pages/blog/blog-filters';
import { BlogGrid } from '@/components/blocks/pages/blog/blog-grid';
import { BlogPagination } from '@/components/blocks/pages/blog/blog-pagination';
import { PaginationMeta } from '@/types';
import { Post } from '@/types/post.types';

export const generateStaticParams = getStaticParams;

async function getPosts(searchParams: {
  page?: string;
  category?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  type?: string;
  limit?: string;
}): Promise<{ posts: Post[]; pagination: PaginationMeta }> {
  try {
    const params = new URLSearchParams();
    if (searchParams.page) params.set('page', searchParams.page);
    if (searchParams.category) params.set('category', searchParams.category);
    if (searchParams.tag) params.set('tag', searchParams.tag);
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy);
    if (searchParams.type) params.set('type', searchParams.type);
    params.set('limit', searchParams.limit || '12');
    params.set('status', 'PUBLISHED');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/posts?${params.toString()}`,
      { cache: 'no-store' },
    );

    if (!res.ok) {
      return {
        posts: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
      };
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return {
      posts: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
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
    title: t.blog.title || 'Blog',
    description:
      t.blog.pageDescription ||
      'Explore articles, tutorials, and stories from our blog',
    keywords: 'blog, articles, tutorials, news, technology',
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/blog`,
      languages: {
        en: `${process.env.NEXT_PUBLIC_APP_URL}/en/blog`,
        vi: `${process.env.NEXT_PUBLIC_APP_URL}/vi/blog`,
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/blog`,
      siteName: 'Anvel',
      title: t.blog.title || 'Blog',
      description:
        t.blog.pageDescription ||
        'Explore articles, tutorials, and stories from our blog',
    },
  };
}

export default async function BlogPage(props: PageProps) {
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

  const { posts, pagination } = await getPosts({
    page: normalizeParam(searchParams?.page),
    category: normalizeParam(searchParams?.category),
    tag: normalizeParam(searchParams?.tag),
    search: normalizeParam(searchParams?.search),
    sortBy: normalizeParam(searchParams?.sortBy),
    type: normalizeParam(searchParams?.type),
  });

  const blogTranslations = {
    allPosts: t.blog.allPosts || 'All Posts',
    searchResults: t.blog.searchResults || 'Search Results',
    postsFound: t.blog.postsFound || 'posts found',
    postFound: t.blog.postFound || 'post found',
    latest: t.blog.latest || 'Latest',
    mostViewed: t.blog.mostViewed || 'Most Viewed',
    trending: t.blog.trending || 'Trending',
    category: t.blog.category || 'Category',
    tag: t.blog.tag || 'Tag',
    type: t.blog.type || 'Type',
    search: t.blog.search || 'Search',
    noPostsFound:
      t.blog.noPostsFound || 'No posts found. Try adjusting your filters.',
    previous: t.common.previous || 'Previous',
    next: t.common.next || 'Next',
    readMore: t.blog.readMore || 'Read More',
    readingTime: t.blog.readingTime || 'min read',
    views: t.common.views || 'views',
    featured: t.blog.featured || 'Featured',
    filterBy: t.blog.filterBy || 'Filter by',
    sortBy: t.blog.sortBy || 'Sort by',
    allCategories: t.blog.allCategories || 'All Categories',
    allTags: t.blog.allTags || 'All Tags',
    allTypes: t.blog.allTypes || 'All Types',
    article: t.blog.types.article || 'Article',
    gallery: t.blog.types.gallery || 'Gallery',
    video: t.blog.types.video || 'Video',
    document: t.blog.types.document || 'Document',
  };

  const featuredPost = posts.find(post => post.isFeatured);
  const regularPosts = posts.filter(post => !post.isFeatured);

  return (
    <MainLayout locale={locale as string}>
      <div className="container mx-auto px-4 py-8">
        <BlogHeader
          searchParams={searchParams}
          translations={blogTranslations}
          pagination={pagination}
        />

        <BlogFilters
          locale={locale as string}
          searchParams={searchParams}
          translations={blogTranslations}
        />

        <BlogGrid
          posts={posts}
          featuredPost={featuredPost}
          regularPosts={regularPosts}
          locale={locale as string}
          translations={blogTranslations}
          currentPage={pagination.page}
        />

        {pagination.totalPages > 1 && (
          <BlogPagination
            pagination={pagination}
            locale={locale as string}
            translations={blogTranslations}
          />
        )}
      </div>
    </MainLayout>
  );
}
