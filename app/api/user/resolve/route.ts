import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/libs/server/rbac';

const resolveMentionsSchema = z.object({
  usernames: z.array(z.string().min(2).max(30)).max(10), // Max 10 mentions per comment
  postId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { usernames, postId } = resolveMentionsSchema.parse(body);

    // Get unique, lowercase usernames
    const uniqueUsernames = [
      ...new Set(usernames.map(u => u.toLowerCase().trim())),
    ];

    // Find users by exact username match
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        username: {
          in: uniqueUsernames,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true, // Return actual username (with proper casing)
      },
    });

    // Return only the minimal data needed
    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        username: u.username,
      })),
    });
  } catch (error) {
    console.error('Error resolving mentions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to resolve mentions' },
      { status: 500 },
    );
  }
}
