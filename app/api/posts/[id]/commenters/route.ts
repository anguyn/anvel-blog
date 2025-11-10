import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { getCurrentUser } from '@/libs/server/rbac';

type MentionUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const sanitizedQuery = query.trim().toLowerCase();

    const commenters = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        comments: {
          some: {
            postId,
            status: 'PUBLISHED',
          },
        },
        username: {
          startsWith: sanitizedQuery,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
      },
      take: 5,
      orderBy: {
        comments: {
          _count: 'desc',
        },
      },
    });

    let additionalUsers: MentionUser[] = [];
    if (commenters.length < 5) {
      additionalUsers = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          username: {
            startsWith: sanitizedQuery,
            mode: 'insensitive',
          },
          NOT: {
            id: {
              in: commenters.map(u => u.id),
            },
          },
        },
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
        },
        take: 5 - commenters.length,
        orderBy: {
          username: 'asc',
        },
      });
    }

    const allUsers = [...commenters, ...additionalUsers];

    return NextResponse.json({
      users: allUsers.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
      })),
    });
  } catch (error) {
    console.error('Error searching users for mention:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 },
    );
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
