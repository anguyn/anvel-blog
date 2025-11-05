import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/server/auth';
import { prisma } from '@/libs/prisma';
import { z } from 'zod';

const COMMENTS_PER_PAGE = 20;

// GET - Fetch comments with pagination and cursor
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: postId } = await params;
    const searchParams = req.nextUrl.searchParams;

    const cursor = searchParams.get('cursor');
    const parentId = searchParams.get('parentId');
    const limit = parseInt(
      searchParams.get('limit') || String(COMMENTS_PER_PAGE),
    );

    const session = await auth();

    const currentUserId = session?.user?.id;

    // Build query
    const where: any = {
      postId,
      status: 'PUBLISHED',
    };

    // If parentId is null, get top-level comments
    // If parentId is provided, get replies to that comment
    if (parentId === 'null' || !parentId) {
      where.parentId = null;
    } else {
      where.parentId = parentId;
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where,
      take: limit + 1, // Take one extra to determine if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        mentions: {
          select: {
            id: true,
            userId: true,
            username: true,
            position: true,
          },
        },
        stickers: {
          include: {
            sticker: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        }),
      },
    });

    // Check if there are more comments
    const hasMore = comments.length > limit;
    const returnComments = hasMore ? comments.slice(0, -1) : comments;

    // Format response
    const formattedComments = returnComments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      isEdited: comment.isEdited,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      isLiked: currentUserId ? comment.likes?.length > 0 : false,
      author: comment.author,
      mentions: comment.mentions,
      sticker: comment.stickers[0]?.sticker,
      parentId: comment.parentId,
      replyTo: comment.parent
        ? {
            id: comment.parent.id,
            username: comment.parent.author.username,
          }
        : undefined,
    }));

    return NextResponse.json({
      comments: formattedComments,
      nextCursor: hasMore ? returnComments[returnComments.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}

// POST - Create comment (fallback for non-socket)
const createCommentSchema = z
  .object({
    content: z.string().min(1).max(2000).optional(),
    parentId: z.string().optional(),
    mentions: z
      .array(
        z.object({
          userId: z.string(),
          username: z.string(),
          position: z.number(),
        }),
      )
      .optional(),
    stickerId: z.string().optional(),
  })
  .refine(data => data.content || data.stickerId, {
    message: 'Either content or sticker is required',
  });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await req.json();

    const validated = createCommentSchema.parse(body);
    const { content, parentId, mentions, stickerId } = validated;

    // Validate mentions - verify users exist and extract exact usernames
    let validatedMentions: any[] = [];
    if (mentions && mentions.length > 0) {
      // Get unique user IDs
      const uniqueUserIds = [...new Set(mentions.map(m => m.userId))];

      const mentionedUsers = await prisma.user.findMany({
        where: {
          id: { in: uniqueUserIds },
          status: 'ACTIVE',
        },
        select: { id: true, username: true },
      });

      // Only include mentions for users that exist
      validatedMentions = mentions
        .filter(m => mentionedUsers.some(u => u.id === m.userId))
        .map(m => {
          const user = mentionedUsers.find(u => u.id === m.userId)!;
          return {
            userId: m.userId,
            username: user.username, // Use actual username from DB
            position: m.position,
          };
        });
    }

    // Create comment
    const comment = await prisma.$transaction(async tx => {
      const newComment = await tx.comment.create({
        data: {
          content: content?.trim() || '',
          postId,
          authorId: session.user.id,
          parentId: parentId || null,
          mentions: {
            create: validatedMentions,
          },
          ...(stickerId && {
            stickers: {
              create: { stickerId },
            },
          }),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          mentions: true,
          stickers: {
            include: { sticker: true },
          },
          parent: {
            select: {
              id: true,
              author: { select: { username: true } },
            },
          },
        },
      });

      if (parentId) {
        await tx.comment.update({
          where: { id: parentId },
          data: { replyCount: { increment: 1 } },
        });
      }

      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: comment.author,
      mentions: comment.mentions,
      sticker: comment.stickers[0]?.sticker,
      likeCount: 0,
      replyCount: 0,
      isLiked: false,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 },
    );
  }
}
