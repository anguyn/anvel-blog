import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { getApiTranslations } from '@/i18n/i18n';

export async function GET(request: Request) {
  const { t } = await getApiTranslations(request);

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';

    if (!query) {
      return NextResponse.json(
        { error: t.api.errors.requiredQuery },
        { status: 400 },
      );
    }

    const results: any = {};

    if (type === 'all' || type === 'snippets') {
      results.snippets = await prisma.snippet.findMany({
        where: {
          isPublic: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
        take: 10,
        orderBy: {
          viewCount: 'desc',
        },
      });
    }

    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          _count: {
            select: {
              snippets: true,
            },
          },
        },
        take: 10,
      });
    }

    if (type === 'all' || type === 'tags') {
      results.tags = await prisma.tag.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        include: {
          _count: {
            select: {
              snippets: true,
            },
          },
        },
        take: 10,
        orderBy: {
          snippets: {
            _count: 'desc',
          },
        },
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: t.api.errors.searchFailed },
      { status: 500 },
    );
  }
}
