import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/libs/services/post.service';
import { getCurrentUser } from '@/libs/server/rbac';
import { getApiTranslations } from '@/i18n/i18n';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { locale } = await getApiTranslations(request);
    const { slug } = await params;
    const user = await getCurrentUser();

    // Get post with translations, passing preferred language
    const result = await PostService.getPostBySlug(slug, user?.id, locale);

    if (!result) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { post, relatedPosts, translations, contentInfo } = result;

    const originalLang = post.language; // 'en' or 'vi'
    const requestedLang = locale; // from URL: /en/blog or /vi/blog

    let displayContent = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      slug: post.slug,
      isTranslated: false,
      originalLanguage: originalLang,
      currentLanguage: originalLang,
    };

    // If requested language is different from original, use translation
    if (requestedLang !== originalLang) {
      const translation = translations.find(t => t.language === requestedLang);

      if (translation) {
        displayContent = {
          title: translation.title,
          excerpt: translation.excerpt || post.excerpt,
          content: translation.content,
          metaTitle: translation.metaTitle || translation.title,
          metaDescription:
            translation.metaDescription ||
            translation.excerpt ||
            post.metaDescription,
          slug: translation.slug,
          isTranslated: true,
          originalLanguage: originalLang,
          currentLanguage: requestedLang,
        };
      }
    }

    return NextResponse.json({
      post: {
        ...post,
        ...displayContent,
      },
      relatedPosts,
      translations,
      contentInfo: {
        isTranslated: displayContent.isTranslated,
        originalLanguage: originalLang,
        currentLanguage: displayContent.currentLanguage,
        availableLanguages: [
          originalLang,
          ...translations.map(t => t.language),
        ],
      },
    });
  } catch (error) {
    console.error('GET /api/posts/[slug] error:', error);

    if (error instanceof Error && error.message === 'ACCESS_DENIED') {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You do not have permission to view this post',
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch post',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
