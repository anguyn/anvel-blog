import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/libs/services/post.service';
import { PostStatus, PostType, PostVisibility } from '@prisma/client';
import type { PostFilters, PostSortOptions } from '@/types/post.types';

// ============================================
// GET /api/posts
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters: PostFilters = {};

    const statusParam = searchParams.get('status');
    if (statusParam) {
      filters.status = statusParam.split(',') as PostStatus[];
    }

    const typeParam = searchParams.get('type');
    if (typeParam) {
      filters.type = typeParam.split(',') as PostType[];
    }

    const visibilityParam = searchParams.get('visibility');
    if (visibilityParam) {
      filters.visibility = visibilityParam.split(',') as PostVisibility[];
    }

    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      filters.categoryId = categoryId;
    }

    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      filters.tags = tagsParam.split(',');
    }

    const authorId = searchParams.get('authorId');
    if (authorId) {
      filters.authorId = authorId;
    }

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }

    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }

    const isFeatured = searchParams.get('isFeatured');
    if (isFeatured) {
      filters.isFeatured = isFeatured === 'true';
    }

    const isPinned = searchParams.get('isPinned');
    if (isPinned) {
      filters.isPinned = isPinned === 'true';
    }

    // Parse sorting
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const sort: PostSortOptions = {
      field: sortField as any,
      order: sortOrder as 'asc' | 'desc',
    };

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get posts
    const result = await PostService.getPostList({
      filters,
      sort,
      pagination: { page, limit },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch posts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
