import { cookies } from 'next/headers';
import { formatCookies, serverFetch } from '@/libs/utils';
import { MainLayout } from '@/components/layouts/main-layout';
import { Post } from '@/types/post.types';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { BlogHeroSection } from '@/components/blocks/pages/blog/view/blog-hero';
import { BlogContent } from '@/components/blocks/pages/blog/view/blog-content';
import { BlogSidebar } from '@/components/blocks/pages/blog/view/blog-sidebar';
import { RelatedPostsSection } from '@/components/blocks/pages/blog/view/related-posts-section';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { auth } from '@/libs/server/auth';
import { verifyPostAccess } from '@/libs/server/utils';
import { TranslationBanner } from '@/components/blocks/pages/blog/view/translation-banner';

export const dynamic = 'force-dynamic';

type PostResponse = {
  post: Post;
  relatedPosts: Post[];
  translations: any[];
  tableOfContents: Array<{ id: string; text: string; level: number }>;
  contentInfo: {
    isTranslated: boolean;
    originalLanguage: string;
    currentLanguage: string;
    availableLanguages: string[];
    translationQuality: 'ai' | 'human' | null;
  };
};

async function getPost(
  slug: string,
  cookieHeader: string,
  locale: string,
): Promise<PostResponse | null> {
  try {
    const res = await serverFetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/posts/by-slug/${slug}`,
      cookieHeader,
      {
        cache: 'no-store',
        headers: {
          'Accept-Language': locale,
        },
      },
    );

    if (!res.ok) return null;

    const data: PostResponse = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return null;
  }
}

async function getRelatedPosts(
  postId: string,
  categoryId: string | null,
  cookieHeader: string,
): Promise<Post[]> {
  try {
    const params = new URLSearchParams();
    params.set('limit', '3');
    params.set('status', 'PUBLISHED');
    if (categoryId) params.set('category', categoryId);

    const res = await serverFetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/posts?${params.toString()}`,
      cookieHeader,
      { cache: 'no-store' },
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.posts.filter((p: Post) => p.id !== postId).slice(0, 3);
  } catch (error) {
    return [];
  }
}

function safeParseDate(
  date: string | Date | null | undefined,
): string | undefined {
  if (!date) return undefined;

  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      console.error('Invalid date:', date);
      return undefined;
    }
    return parsed.toISOString();
  } catch (error) {
    console.error('Error parsing date:', date, error);
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: 'vi' | 'en'; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const cookieStore = await cookies();
  const cookieHeader = formatCookies(cookieStore.getAll());

  const result = await getPost(slug || '', cookieHeader, locale);
  const post = result?.post;

  if (!post) {
    return { title: 'Post Not Found' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const originalLang = post.language;
  const canonicalUrl = `${baseUrl}/${originalLang}/blog/${post.slug}`;

  const alternateLanguages: Record<string, string> = {
    'x-default': canonicalUrl,
  };

  alternateLanguages[originalLang] =
    `${baseUrl}/${originalLang}/blog/${post.slug}`;

  if (post.translations) {
    post.translations.forEach((trans: any) => {
      alternateLanguages[trans.language] =
        `${baseUrl}/${trans.language}/blog/${trans.slug}`;
    });
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || '',

    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },

    openGraph: {
      type: 'article',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      alternateLocale: locale === 'vi' ? ['en_US'] : ['vi_VN'],
      url: `${baseUrl}/${locale}/blog/${slug}`,
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      images: post.featuredImage ? [post.featuredImage] : [],
    },

    robots: {
      index: post.visibility === 'PUBLIC',
      follow: post.visibility === 'PUBLIC',
    },

    other: {
      'content-language': locale,
      'article:original-language': originalLang,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const session = await auth();
  const cookieStore = await cookies();
  const cookieHeader = formatCookies(cookieStore.getAll());

  const result = await getPost(slug, cookieHeader, locale);

  if (!result) {
    notFound();
  }

  const { post, relatedPosts, translations, contentInfo, tableOfContents } =
    result;

  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  if (post.isPasswordProtected && post.visibility === 'PASSWORD') {
    const isAuthor = session?.user?.id === post.authorId;

    if (!isAuthor) {
      const { hasAccess } = await verifyPostAccess(slug);

      if (!hasAccess) {
        redirect(`/${locale}/blog/${slug}/password`);
      }
    }
  }

  if (post.visibility === 'RESTRICTED' && !session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/blog/${slug}`);
  }

  const blogTranslations = {
    share: t.common.share,
    save: t.common.save,
    saved: t.common.saved,
    edit: t.common.edit,
    delete: t.common.delete,
    views: t.common.views,
    readingTime: t.blog.readingTime,
    publishedOn: t.blog.publishedOn,
    updatedOn: t.blog.updatedOn,
    category: t.blog.category,
    tags: t.blog.tags,
    relatedPosts: t.blog.relatedPosts,
    tableOfContents: t.blog.tableOfContents,
    comments: t.blog.comments,
    leaveComment: t.blog.leaveComment,
    noComments: t.blog.noComments,
    aboutAuthor: t.blog.aboutAuthor,
    viewProfile: t.blog.viewProfile,
    moreFromAuthor: t.blog.moreFromAuthor,
    loginToComment: t.blog.loginToComment,
  };

  const publishedTime = safeParseDate(post.publishedAt);
  const modifiedTime = safeParseDate(post.updatedAt || post.createdAt);

  return (
    <MainLayout locale={locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt || '',
            image: post.featuredImage || '',
            ...(publishedTime && { datePublished: publishedTime }),
            ...(modifiedTime && { dateModified: modifiedTime }),
            author: {
              '@type': 'Person',
              name: post.author.name || post.author.username,
              url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/users/${post.author.username}`,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Anvel',
              logo: {
                '@type': 'ImageObject',
                url: `${process.env.NEXT_PUBLIC_APP_URL}/images/logo.png`,
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/blog/${slug}`,
            },
            keywords: post.tags.map(t => t.tag.name).join(', '),
            articleSection: post.category?.name || '',
            wordCount: post.content.split(/\s+/).length,
            ...(post.readingTime && {
              timeRequired: `PT${post.readingTime}M`,
            }),
          }),
        }}
      />

      <div className="relative">
        {contentInfo.isTranslated && (
          <TranslationBanner
            originalLanguage={contentInfo.originalLanguage}
            currentLanguage={contentInfo.currentLanguage}
            originalSlug={post.slug}
            locale={locale}
          />
        )}
        <BlogHeroSection post={post} locale={locale} session={session} />

        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto gap-8 md:grid lg:grid-cols-12">
            <BlogContent
              post={post}
              locale={locale}
              translations={blogTranslations}
            />

            <BlogSidebar
              tableOfContents={tableOfContents}
              post={post}
              locale={locale}
              translations={blogTranslations}
              session={session}
            />
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <RelatedPostsSection
            posts={relatedPosts}
            locale={locale}
            title={blogTranslations.relatedPosts}
          />
        )}
      </div>
    </MainLayout>
  );
}
