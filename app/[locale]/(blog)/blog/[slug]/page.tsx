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

export const dynamic = 'force-dynamic';

export const generateStaticParams = getStaticParams;

type PostResponse = {
  post: Post;
  relatedPosts: Post[];
  translations: any[];
};

async function getPost(
  slug: string,
  cookieHeader: string,
): Promise<Post | null> {
  try {
    const res = await serverFetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/posts/${slug}`,
      cookieHeader,
      { cache: 'no-store' },
    );

    if (!res.ok) return null;

    // FIX: Extract 'post' from response
    const data: PostResponse = await res.json();
    return data.post || null;
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

// FIX: Safe date parsing helper
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

  const post = await getPost(slug || '', cookieHeader);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const postUrl = `${baseUrl}/${locale}/blog/${slug}`;

  if (!post) {
    return {
      title: t.blog.notFound || 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const authorName = post.author.name || post.author.username || 'Anonymous';

  const keywords = [
    ...(post.metaKeywords || []),
    post.category?.name || '',
    ...post.tags.map(t => t.tag.name),
    authorName,
  ].filter(Boolean);

  // FIX: Safe date parsing
  const publishedTime = safeParseDate(post.publishedAt);
  const modifiedTime = safeParseDate(post.updatedAt || post.createdAt);

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || '',
    keywords,
    authors: [
      {
        name: authorName,
        url: `${baseUrl}/${locale}/users/${post.author.username}`,
      },
    ],
    creator: authorName,
    publisher: 'Anvel',

    alternates: {
      canonical: postUrl,
      languages: {
        en: `${baseUrl}/en/blog/${slug}`,
        vi: `${baseUrl}/vi/blog/${slug}`,
      },
    },

    openGraph: {
      type: 'article',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      url: postUrl,
      siteName: 'Anvel',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',

      authors: [authorName],
      publishedTime,
      modifiedTime,

      tags: post.tags.map(t => t.tag.name),

      images: post.featuredImage
        ? [
            {
              url: post.featuredImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [],
    },

    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      creator: '@anvel',
      images: post.featuredImage ? [post.featuredImage] : [],
    },

    category: post.category?.name,

    robots: {
      index: post.visibility === 'PUBLIC',
      follow: post.visibility === 'PUBLIC',
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },

    other: {
      'article:author': authorName,
      'article:published_time': publishedTime || '',
      'article:modified_time': modifiedTime || '',
      'article:section': post.category?.name || '',
      'article:tag': post.tags.map(t => t.tag.name).join(','),
    },
  };
}

export default async function BlogDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ password?: string }>;
}) {
  const { locale, slug } = await params;
  const { password } = await searchParams;

  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const session = await auth();
  const cookieStore = await cookies();
  const cookieHeader = formatCookies(cookieStore.getAll());

  const post = await getPost(slug, cookieHeader);

  if (!post) {
    notFound();
  }

  // Check password protection
  if (post.isPasswordProtected && post.visibility === 'PASSWORD') {
    const isAuthor = session?.user?.id === post.authorId;
    if (!isAuthor && !password) {
      redirect(`/${locale}/blog/${slug}/password`);
    }
  }

  // Check restricted access
  if (post.visibility === 'RESTRICTED' && !session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/blog/${slug}`);
  }

  const relatedPosts = await getRelatedPosts(
    post.id,
    post.categoryId,
    cookieHeader,
  );

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

  // FIX: Safe date parsing for JSON-LD
  const publishedTime = safeParseDate(post.publishedAt);
  const modifiedTime = safeParseDate(post.updatedAt || post.createdAt);

  return (
    <MainLayout locale={locale}>
      {/* JSON-LD Structured Data */}
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
        {/* Hero Section with Post Header */}
        <BlogHeroSection post={post} locale={locale} session={session} />

        {/* Main Content Area */}
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto grid gap-8 lg:grid-cols-12">
            {/* Main Content */}
            <BlogContent
              post={post}
              locale={locale}
              translations={blogTranslations}
              session={session}
            />

            {/* Desktop Sidebar */}
            <BlogSidebar
              post={post}
              locale={locale}
              translations={blogTranslations}
              session={session}
            />
          </div>
        </div>

        {/* Related Posts */}
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
