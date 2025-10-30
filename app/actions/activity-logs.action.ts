'use server';

import { prisma } from '@/libs/prisma';
import { requirePermission } from '@/libs/server/auth';
import {
  ActivityLog,
  ActivityLogFilters,
  ApiResponse,
  PaginatedResponse,
  LogLevel,
} from '@/types';

// ============================================
// GET ACTIVITY LOGS
// ============================================
export async function getActivityLogs(
  filters: ActivityLogFilters = {},
): Promise<ApiResponse<PaginatedResponse<ActivityLog>>> {
  try {
    await requirePermission('settings:manage');

    const {
      search = '',
      action = 'all',
      entity = 'all',
      userId = 'all',
      importance = 'all',
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Search in action and entity
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by action
    if (action !== 'all') {
      where.action = action;
    }

    // Filter by entity
    if (entity !== 'all') {
      where.entity = entity;
    }

    // Filter by user
    if (userId !== 'all') {
      where.userId = userId;
    }

    // Filter by importance
    if (importance !== 'all') {
      where.importance = importance;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: logs as ActivityLog[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch activity logs',
    };
  }
}

// ============================================
// GET DISTINCT ACTIONS (for filter)
// ============================================
export async function getDistinctActions(): Promise<ApiResponse<string[]>> {
  try {
    await requirePermission('settings:manage');

    const actions = await prisma.activityLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
      take: 100,
    });

    return {
      success: true,
      data: actions.map(a => a.action),
    };
  } catch (error: any) {
    console.error('Get actions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch actions',
    };
  }
}

// ============================================
// GET DISTINCT ENTITIES (for filter)
// ============================================
export async function getDistinctEntities(): Promise<ApiResponse<string[]>> {
  try {
    await requirePermission('settings:manage');

    const entities = await prisma.activityLog.findMany({
      select: { entity: true },
      distinct: ['entity'],
      orderBy: { entity: 'asc' },
      take: 100,
    });

    return {
      success: true,
      data: entities.map(e => e.entity),
    };
  } catch (error: any) {
    console.error('Get entities error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch entities',
    };
  }
}

// ============================================
// GET ACTIVITY LOG DETAILS
// ============================================
export async function getActivityLogDetails(
  logId: string,
): Promise<ApiResponse<ActivityLog>> {
  try {
    await requirePermission('settings:manage');

    const log = await prisma.activityLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!log) {
      return {
        success: false,
        error: 'Activity log not found',
      };
    }

    return {
      success: true,
      data: log as ActivityLog,
    };
  } catch (error: any) {
    console.error('Get activity log details error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch activity log details',
    };
  }
}

// ============================================
// CLEANUP OLD LOGS
// ============================================
export async function cleanupOldLogs(): Promise<ApiResponse> {
  try {
    await requirePermission('settings:manage');

    const now = new Date();

    // Delete expired logs
    const result = await prisma.activityLog.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    return {
      success: true,
      message: `Cleaned up ${result.count} expired log(s)`,
    };
  } catch (error: any) {
    console.error('Cleanup logs error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cleanup logs',
    };
  }
}

// ============================================
// GET ACTIVITY STATS
// ============================================
export async function getActivityStats(): Promise<
  ApiResponse<{
    total: number;
    byImportance: Record<LogLevel, number>;
    byEntity: Array<{ entity: string; count: number }>;
    byAction: Array<{ action: string; count: number }>;
  }>
> {
  try {
    await requirePermission('settings:manage');

    const [total, byImportance, byEntity, byAction] = await Promise.all([
      prisma.activityLog.count(),

      // Group by importance
      prisma.activityLog.groupBy({
        by: ['importance'],
        _count: true,
      }),

      // Top entities
      prisma.activityLog.groupBy({
        by: ['entity'],
        _count: true,
        orderBy: {
          _count: {
            entity: 'desc',
          },
        },
        take: 10,
      }),

      // Top actions
      prisma.activityLog.groupBy({
        by: ['action'],
        _count: true,
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    const importanceMap: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARNING]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.CRITICAL]: 0,
    };

    byImportance.forEach(item => {
      importanceMap[item.importance as LogLevel] = item._count;
    });

    return {
      success: true,
      data: {
        total,
        byImportance: importanceMap,
        byEntity: byEntity.map(item => ({
          entity: item.entity,
          count: item._count,
        })),
        byAction: byAction.map(item => ({
          action: item.action,
          count: item._count,
        })),
      },
    };
  } catch (error: any) {
    console.error('Get activity stats error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch activity stats',
    };
  }
}
