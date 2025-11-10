import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/server/auth';
import { prisma } from '@/libs/prisma';
import { z } from 'zod';

const COMMENTS_PER_PAGE = 2;
const INITIAL_REPLIES_PER_COMMENT = 3;
const REPLIES_PER_PAGE = 3;

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

    const where: any = {
      postId,
      status: 'PUBLISHED',
    };

    const isTopLevel = parentId === 'null' || !parentId;

    if (isTopLevel) {
      where.parentId = null;
    } else {
      where.parentId = parentId;
    }

    const totalComments = isTopLevel
      ? await prisma.comment.count({ where })
      : null;

    const baseInclude = {
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
    };

    const replyInclude = {
      ...baseInclude,
      ...(currentUserId && {
        likes: {
          where: { userId: currentUserId },
          select: { id: true },
        },
      }),
    };

    console.log('📝 Fetching:', {
      isTopLevel,
      cursor,
      limit,
      parentId,
    });

    const effectiveLimit = isTopLevel
      ? limit
      : cursor
        ? REPLIES_PER_PAGE
        : INITIAL_REPLIES_PER_COMMENT;

    const findManyArgs: any = {
      where,
      take: effectiveLimit + 1,
      orderBy: { createdAt: isTopLevel ? 'desc' : 'asc' },
      include: {
        ...baseInclude,
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        }),
      },
    };

    if (cursor) {
      findManyArgs.cursor = { id: cursor };
      findManyArgs.skip = 1;
    }

    const comments = await prisma.comment.findMany(findManyArgs);

    const hasMore = comments.length > effectiveLimit;
    const returnComments = hasMore ? comments.slice(0, -1) : comments;

    const formatComment = (comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      isEdited: comment.isEdited,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      isLiked: currentUserId ? (comment.likes?.length ?? 0) > 0 : false,
      author: comment.author,
      mentions: comment.mentions,
      sticker: comment.stickers?.[0]?.sticker ?? null,
      parentId: comment.parentId,
      replyTo: comment.parent
        ? {
            id: comment.parent.id,
            username: comment.parent.author.username,
          }
        : undefined,
    });

    let formattedComments: any[];

    if (isTopLevel) {
      const commentIds = returnComments.map(c => c.id);

      const allReplies = await prisma.comment.findMany({
        where: {
          parentId: { in: commentIds },
          status: 'PUBLISHED',
        },
        orderBy: { createdAt: 'asc' },
        take: INITIAL_REPLIES_PER_COMMENT * commentIds.length,
        include: replyInclude,
      });

      const repliesByParentId = new Map<string, any[]>();
      allReplies.forEach(reply => {
        if (!repliesByParentId.has(reply.parentId!)) {
          repliesByParentId.set(reply.parentId!, []);
        }
        repliesByParentId.get(reply.parentId!)!.push(reply);
      });

      formattedComments = returnComments.map(comment => {
        const allRepliesForComment = repliesByParentId.get(comment.id) || [];

        const replies = allRepliesForComment.slice(
          0,
          INITIAL_REPLIES_PER_COMMENT,
        );

        const hasMoreReplies = comment.replyCount > INITIAL_REPLIES_PER_COMMENT;

        const nextRepliesCursor =
          hasMoreReplies && replies.length > 0
            ? replies[replies.length - 1].id
            : null;

        return {
          ...formatComment(comment),
          replies: replies.map(formatComment),
          hasMoreReplies,
          nextRepliesCursor,
        };
      });
    } else {
      formattedComments = returnComments.map(formatComment);
    }

    const nextCursor =
      hasMore && returnComments.length > 0
        ? returnComments[returnComments.length - 1].id
        : null;

    const response: any = {
      comments: formattedComments,
      nextCursor,
      hasMore,
    };

    if (isTopLevel && totalComments !== null) {
      response.totalComments = totalComments;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error fetching comments:', error);
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

    let validatedMentions: any[] = [];
    if (mentions && mentions.length > 0) {
      const uniqueUserIds = [...new Set(mentions.map(m => m.userId))];

      const mentionedUsers = await prisma.user.findMany({
        where: {
          id: { in: uniqueUserIds },
          status: 'ACTIVE',
        },
        select: { id: true, username: true },
      });

      validatedMentions = mentions
        .filter(m => mentionedUsers.some(u => u.id === m.userId))
        .map(m => {
          const user = mentionedUsers.find(u => u.id === m.userId)!;
          return {
            userId: m.userId,
            username: user.username,
            position: m.position,
          };
        });
    }

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
