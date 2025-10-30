'use server';

import { prisma } from '@/libs/prisma';
import { requirePermission } from '@/libs/server/auth';
import { revalidatePath } from 'next/cache';
import {
  Session,
  RevokedSession,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface SessionFilters {
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// GET ALL ACTIVE SESSIONS
// ============================================
export async function getAllSessions(
  filters: SessionFilters = {},
): Promise<ApiResponse<PaginatedResponse<Session>>> {
  try {
    await requirePermission('settings:manage');

    const { search = '', page = 1, limit = 20 } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          expires: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.session.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: sessions as Session[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  } catch (error: any) {
    console.error('Get sessions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch sessions',
    };
  }
}

// ============================================
// GET USER SESSIONS
// ============================================
export async function getUserSessions(
  userId: string,
): Promise<ApiResponse<Session[]>> {
  try {
    await requirePermission('settings:manage');

    const sessions = await prisma.session.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        expires: 'desc',
      },
    });

    return {
      success: true,
      data: sessions as Session[],
    };
  } catch (error: any) {
    console.error('Get user sessions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user sessions',
    };
  }
}

// ============================================
// REVOKE SESSION
// ============================================
export async function revokeSession(
  sessionId: string,
  reason: string = 'REVOKED_BY_ADMIN',
): Promise<ApiResponse> {
  try {
    const session = await requirePermission('settings:manage');

    const targetSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetSession) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Create revoked session record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.revokedSession.create({
      data: {
        userId: targetSession.userId,
        sessionToken: targetSession.sessionToken,
        reason,
        expiresAt,
      },
    });

    // Delete session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'SESSION_REVOKED',
        entity: 'session',
        entityId: sessionId,
        metadata: {
          targetUser: targetSession.user.email,
          reason,
        },
        importance: 'WARNING',
        retentionDays: 90,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/sessions');

    return {
      success: true,
      message: `Session revoked for ${targetSession.user.email}`,
    };
  } catch (error: any) {
    console.error('Revoke session error:', error);
    return {
      success: false,
      error: error.message || 'Failed to revoke session',
    };
  }
}

// ============================================
// REVOKE ALL EXPIRED SESSIONS
// ============================================
export async function revokeExpiredSessions(): Promise<ApiResponse> {
  try {
    const session = await requirePermission('settings:manage');

    const now = new Date();

    // Find expired sessions
    const expiredSessions = await prisma.session.findMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });

    if (expiredSessions.length === 0) {
      return {
        success: true,
        message: 'No expired sessions found',
      };
    }

    // Create revoked session records
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.revokedSession.createMany({
      data: expiredSessions.map(s => ({
        userId: s.userId,
        sessionToken: s.sessionToken,
        reason: 'EXPIRED',
        expiresAt,
      })),
    });

    // Delete expired sessions
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPIRED_SESSIONS_CLEANED',
        entity: 'session',
        metadata: {
          count: result.count,
        },
        importance: 'INFO',
        retentionDays: 30,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/sessions');

    return {
      success: true,
      message: `Revoked ${result.count} expired session(s)`,
    };
  } catch (error: any) {
    console.error('Revoke expired sessions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to revoke expired sessions',
    };
  }
}

// ============================================
// GET REVOKED SESSIONS
// ============================================
export async function getRevokedSessions(
  filters: SessionFilters = {},
): Promise<ApiResponse<PaginatedResponse<RevokedSession>>> {
  try {
    await requirePermission('settings:manage');

    const { page = 1, limit = 20 } = filters;

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.revokedSession.findMany({
        orderBy: {
          revokedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.revokedSession.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: sessions as RevokedSession[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  } catch (error: any) {
    console.error('Get revoked sessions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch revoked sessions',
    };
  }
}

// ============================================
// CLEANUP REVOKED SESSIONS
// ============================================
export async function cleanupRevokedSessions(): Promise<ApiResponse> {
  try {
    const session = await requirePermission('settings:manage');

    const now = new Date();

    // Delete expired revoked sessions
    const result = await prisma.revokedSession.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'REVOKED_SESSIONS_CLEANED',
        entity: 'session',
        metadata: {
          count: result.count,
        },
        importance: 'INFO',
        retentionDays: 30,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/sessions');

    return {
      success: true,
      message: `Cleaned up ${result.count} expired revoked session(s)`,
    };
  } catch (error: any) {
    console.error('Cleanup revoked sessions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cleanup revoked sessions',
    };
  }
}

// ============================================
// GET SESSION STATISTICS
// ============================================
export async function getSessionStats(): Promise<
  ApiResponse<{
    totalActive: number;
    totalRevoked: number;
    expiringSoon: number;
    byUser: Array<{ userId: string; email: string; count: number }>;
  }>
> {
  try {
    await requirePermission('settings:manage');

    const now = new Date();
    const soon = new Date();
    soon.setHours(soon.getHours() + 24); // Next 24 hours

    const [totalActive, totalRevoked, expiringSoon, byUser] = await Promise.all(
      [
        prisma.session.count(),
        prisma.revokedSession.count(),
        prisma.session.count({
          where: {
            expires: {
              gte: now,
              lte: soon,
            },
          },
        }),
        prisma.session.groupBy({
          by: ['userId'],
          _count: true,
          orderBy: {
            _count: {
              userId: 'desc',
            },
          },
          take: 10,
        }),
      ],
    );

    // Get user info for top sessions
    const userIds = byUser.map(item => item.userId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u.email]));

    return {
      success: true,
      data: {
        totalActive,
        totalRevoked,
        expiringSoon,
        byUser: byUser.map(item => ({
          userId: item.userId,
          email: userMap.get(item.userId) || 'Unknown',
          count: item._count,
        })),
      },
    };
  } catch (error: any) {
    console.error('Get session stats error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch session stats',
    };
  }
}
