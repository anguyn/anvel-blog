'use server';

import { prisma } from '@/libs/prisma';
import { requirePermission } from '@/libs/server/auth';
import { DashboardStats, ApiResponse } from '@/types';

// ============================================
// GET DASHBOARD STATISTICS
// ============================================
export async function getDashboardStats(): Promise<
  ApiResponse<DashboardStats>
> {
  try {
    await requirePermission('settings:manage');

    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for performance
    const [
      // Users stats
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersLastMonth,

      // Posts stats
      totalPosts,
      publishedPosts,
      draftPosts,
      // totalViews,

      // Comments stats
      totalComments,
      pendingComments,
      spamComments,

      // Media stats
      totalMedia,
      mediaThisMonth,
      mediaSize,

      // Recent data
      recentActivity,
      topPosts,
      recentUsers,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: startOfMonth,
          },
        },
      }),

      // Posts
      prisma.post.count(),
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'DRAFT' } }),
      // prisma.postView.count(),

      // Comments
      prisma.comment.count(),
      prisma.comment.count({ where: { status: 'PENDING' } }),
      prisma.comment.count({ where: { status: 'SPAM' } }),

      // Media
      prisma.media.count(),
      prisma.media.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.media.aggregate({
        _sum: { size: true },
      }),

      // Recent activity
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      // Top posts
      prisma.post.findMany({
        take: 5,
        orderBy: { viewCount: 'desc' },
        include: {
          author: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),

      // Recent users
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          role: true,
        },
      }),
    ]);

    // Calculate growth
    const userGrowth =
      newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : 100;

    const stats: DashboardStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsersThisMonth,
        growth: Math.round(userGrowth * 10) / 10,
      },
      posts: {
        total: totalPosts,
        published: publishedPosts,
        draft: draftPosts,
        views: 999,
      },
      comments: {
        total: totalComments,
        pending: pendingComments,
        spam: spamComments,
      },
      media: {
        total: totalMedia,
        size: mediaSize._sum.size || 0,
        thisMonth: mediaThisMonth,
      },
      recentActivity: recentActivity as any,
      topPosts: topPosts as any,
      recentUsers: recentUsers as any,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard stats',
    };
  }
}

// ============================================
// GET CHART DATA - User Growth
// ============================================
export async function getUserGrowthData(
  days: number = 30,
): Promise<ApiResponse<Array<{ date: string; users: number }>>> {
  try {
    await requirePermission('settings:manage');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const grouped = new Map<string, number>();
    users.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    // Convert to array
    const data = Array.from(grouped.entries()).map(([date, users]) => ({
      date,
      users,
    }));

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Get user growth data error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user growth data',
    };
  }
}

// ============================================
// GET CHART DATA - Posts Activity
// ============================================
export async function getPostsActivityData(
  days: number = 30,
): Promise<
  ApiResponse<Array<{ date: string; published: number; draft: number }>>
> {
  try {
    await requirePermission('settings:manage');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date and status
    const grouped = new Map<string, { published: number; draft: number }>();
    posts.forEach(post => {
      const date = post.createdAt.toISOString().split('T')[0];
      const current = grouped.get(date) || { published: 0, draft: 0 };

      if (post.status === 'PUBLISHED') {
        current.published++;
      } else if (post.status === 'DRAFT') {
        current.draft++;
      }

      grouped.set(date, current);
    });

    // Convert to array
    const data = Array.from(grouped.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Get posts activity data error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch posts activity data',
    };
  }
}
