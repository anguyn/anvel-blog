import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/libs/services/post.service';
import { getCurrentUser } from '@/libs/server/rbac';

// ============================================
// GET /api/posts/[slug] - Get single post
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const user = await getCurrentUser();

    const result = await PostService.getPostBySlug(slug, user?.id);

    if (!result) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(result);
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
