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

    // Build where clause
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

    // Fetch total comments count (chỉ cho top-level)
    const totalComments = isTopLevel
      ? await prisma.comment.count({ where })
      : null;

    // Base include structure
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

    // Reply include with likes if user is authenticated
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

    // ✅ FIX: Tính toán limit đúng cho từng case
    const effectiveLimit = isTopLevel
      ? limit
      : cursor
        ? REPLIES_PER_PAGE
        : INITIAL_REPLIES_PER_COMMENT;

    // Build query
    const findManyArgs: any = {
      where,
      take: effectiveLimit + 1, // +1 để detect hasMore
      orderBy: { createdAt: isTopLevel ? 'desc' : 'asc' }, // ✅ Replies sắp xếp asc
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

    // Fetch comments
    const comments = await prisma.comment.findMany(findManyArgs);

    console.log(
      `📌 Raw: ${comments.length} comments (limit: ${effectiveLimit}, cursor: ${cursor ? '✓' : '✗'})`,
    );

    // Check if there are more comments
    const hasMore = comments.length > effectiveLimit;
    const returnComments = hasMore ? comments.slice(0, -1) : comments;

    console.log(
      `✅ Return: ${returnComments.length} comments, hasMore: ${hasMore}`,
    );

    // Helper function to format a single comment
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
      // ✅ Fetch INITIAL replies cho mỗi comment (chỉ 3 cái đầu)
      const commentIds = returnComments.map(c => c.id);

      const allReplies = await prisma.comment.findMany({
        where: {
          parentId: { in: commentIds },
          status: 'PUBLISHED',
        },
        orderBy: { createdAt: 'asc' }, // ✅ Replies luôn asc
        take: INITIAL_REPLIES_PER_COMMENT * commentIds.length, // Lấy nhiều hơn để group
        include: replyInclude,
      });

      // Group replies theo parentId
      const repliesByParentId = new Map<string, any[]>();
      allReplies.forEach(reply => {
        if (!repliesByParentId.has(reply.parentId!)) {
          repliesByParentId.set(reply.parentId!, []);
        }
        repliesByParentId.get(reply.parentId!)!.push(reply);
      });

      // Format comments với INITIAL replies
      formattedComments = returnComments.map(comment => {
        const allRepliesForComment = repliesByParentId.get(comment.id) || [];

        // ✅ CHỈ LẤY 3 REPLIES ĐẦU TIÊN
        const replies = allRepliesForComment.slice(
          0,
          INITIAL_REPLIES_PER_COMMENT,
        );

        // ✅ Check hasMoreReplies dựa vào replyCount từ DB
        const hasMoreReplies = comment.replyCount > INITIAL_REPLIES_PER_COMMENT;

        // ✅ nextRepliesCursor là ID của reply cuối cùng trong initial batch
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
      // ✅ Đang fetch MORE replies
      formattedComments = returnComments.map(formatComment);

      console.log('📋 Fetching MORE replies:', {
        parentId,
        cursor,
        returned: returnComments.length,
        hasMore,
      });
    }

    // ✅ nextCursor cho comments hoặc replies
    const nextCursor =
      hasMore && returnComments.length > 0
        ? returnComments[returnComments.length - 1].id
        : null;

    console.log('📤 Response:', {
      count: returnComments.length,
      nextCursor,
      hasMore,
      isTopLevel,
    });

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
