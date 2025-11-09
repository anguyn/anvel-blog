import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/libs/services/post.service';
import { getCurrentUser } from '@/libs/server/rbac';
import { getApiTranslations } from '@/i18n/i18n';

// Utility function to generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Normalize Vietnamese characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Extract headings and inject IDs into HTML content
function injectHeadingIds(htmlContent: string): {
  content: string;
  headings: Array<{ id: string; text: string; level: number }>;
} {
  const headings: Array<{ id: string; text: string; level: number }> = [];
  const headingCounters = new Map<string, number>(); // To handle duplicate headings

  const contentWithIds = htmlContent.replace(
    /<h([2-4])([^>]*)>(.*?)<\/h\1>/gi,
    (match, level, attributes, text) => {
      // Extract plain text from heading (remove HTML tags if any)
      const plainText = text.replace(/<[^>]*>/g, '').trim();

      // Generate base slug
      let baseSlug = generateSlug(plainText);

      // Handle duplicates by adding counter
      const count = headingCounters.get(baseSlug) || 0;
      headingCounters.set(baseSlug, count + 1);

      const id = count > 0 ? `${baseSlug}-${count}` : baseSlug;

      // Store heading info
      headings.push({
        id,
        text: plainText,
        level: parseInt(level),
      });

      // Check if id already exists in attributes
      const hasId = /id\s*=\s*["'][^"']*["']/i.test(attributes);

      if (hasId) {
        // Replace existing id
        return `<h${level}${attributes.replace(/id\s*=\s*["'][^"']*["']/i, `id="${id}"`)}>${text}</h${level}>`;
      } else {
        // Add new id
        return `<h${level} id="${id}"${attributes}>${text}</h${level}>`;
      }
    },
  );

  return {
    content: contentWithIds,
    headings,
  };
}

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

    const originalLang = post.language;
    const requestedLang = locale;

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

    // Inject heading IDs and extract table of contents
    const { content: processedContent, headings } = injectHeadingIds(
      displayContent.content,
    );

    return NextResponse.json({
      post: {
        ...post,
        ...displayContent,
        content: processedContent, // Content with IDs injected
      },
      relatedPosts,
      translations,
      tableOfContents: headings, // Add TOC data
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
