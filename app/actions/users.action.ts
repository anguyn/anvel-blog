'use server';

import { prisma } from '@/libs/prisma';
import { requireAuth, requirePermission } from '@/libs/server/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import {
  AdminUserFormData,
  AdminUserUpdateData,
  UserFilters,
  ApiResponse,
  PaginatedResponse,
  AdminUser,
  UserStatus,
} from '@/types';

// ============================================
// GET USERS WITH FILTERS
// ============================================
export async function getUsers(
  filters: UserFilters = {},
): Promise<ApiResponse<PaginatedResponse<AdminUser>>> {
  try {
    await requirePermission('users:manage');

    const {
      search = '',
      status = 'all',
      roleId = 'all',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (roleId !== 'all') {
      where.roleId = roleId;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: users as AdminUser[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  } catch (error: any) {
    console.error('Get users error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch users',
    };
  }
}

// ============================================
// GET SINGLE USER
// ============================================
export async function getUser(userId: string): Promise<ApiResponse<AdminUser>> {
  try {
    await requirePermission('users:manage');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      data: user as AdminUser,
    };
  } catch (error: any) {
    console.error('Get user error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user',
    };
  }
}

// ============================================
// CREATE USER
// ============================================
export async function createUser(
  data: AdminUserFormData,
): Promise<ApiResponse<AdminUser>> {
  try {
    const session = await requirePermission('users:manage');

    // Validate email uniqueness
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.username ? [{ username: data.username }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        return {
          success: false,
          error: 'Email already exists',
        };
      }
      if (existingUser.username === data.username) {
        return {
          success: false,
          error: 'Username already exists',
        };
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        username: data.username || null,
        password: hashedPassword,
        roleId: data.roleId || null,
        status: data.status,
        bio: data.bio || null,
        emailVerified: new Date(), // Auto-verify admin-created users
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_CREATED',
        entity: 'user',
        entityId: user.id,
        metadata: {
          userName: user.name,
          userEmail: user.email,
        },
        importance: 'INFO',
        retentionDays: 90,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      data: user as AdminUser,
      message: 'User created successfully',
    };
  } catch (error: any) {
    console.error('Create user error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create user',
    };
  }
}

// ============================================
// UPDATE USER
// ============================================
export async function updateUser(
  userId: string,
  data: AdminUserUpdateData,
): Promise<ApiResponse<AdminUser>> {
  try {
    const session = await requirePermission('users:manage');

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Validate username uniqueness if changed
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username: data.username,
          id: { not: userId },
        },
      });

      if (usernameExists) {
        return {
          success: false,
          error: 'Username already exists',
        };
      }
    }

    // Prepare update data
    const updateData: any = {
      name: data.name,
      username: data.username || null,
      roleId: data.roleId || null,
      status: data.status,
      bio: data.bio || null,
    };

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
      updateData.passwordChangedAt = new Date();
      // Update security stamp to invalidate existing sessions
      updateData.securityStamp = require('crypto')
        .randomBytes(32)
        .toString('hex');
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const metadata = {
      userName: user.name,
      userEmail: user.email,
      changes: data,
    };

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_UPDATED',
        entity: 'user',
        entityId: user.id,
        metadata: JSON.stringify(metadata),
        importance: 'INFO',
        retentionDays: 90,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);

    return {
      success: true,
      data: user as AdminUser,
      message: 'User updated successfully',
    };
  } catch (error: any) {
    console.error('Update user error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update user',
    };
  }
}

// ============================================
// DELETE USER
// ============================================
export async function deleteUser(userId: string): Promise<ApiResponse> {
  try {
    const session = await requirePermission('users:manage');

    // Don't allow deleting self
    if (userId === session.user.id) {
      return {
        success: false,
        error: 'Cannot delete your own account',
      };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_DELETED',
        entity: 'user',
        entityId: userId,
        metadata: {
          userName: user.name,
          userEmail: user.email,
        },
        importance: 'WARNING',
        retentionDays: 180,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error: any) {
    console.error('Delete user error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete user',
    };
  }
}

// ============================================
// BULK UPDATE STATUS
// ============================================
export async function bulkUpdateUserStatus(
  userIds: string[],
  status: UserStatus,
): Promise<ApiResponse> {
  try {
    const session = await requirePermission('users:manage');

    // Don't allow updating self
    if (userIds.includes(session.user.id)) {
      return {
        success: false,
        error: 'Cannot update your own status',
      };
    }

    await prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        status,
        // Update security stamp to invalidate sessions if suspended/banned
        ...(status !== 'ACTIVE' && {
          securityStamp: require('crypto').randomBytes(32).toString('hex'),
        }),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'BULK_USER_STATUS_UPDATE',
        entity: 'user',
        metadata: {
          userIds,
          status,
          count: userIds.length,
        },
        importance: 'WARNING',
        retentionDays: 90,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: `${userIds.length} users updated successfully`,
    };
  } catch (error: any) {
    console.error('Bulk update error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update users',
    };
  }
}

// ============================================
// GET ALL ROLES (for dropdown)
// ============================================
export async function getAllRoles(): Promise<
  ApiResponse<
    Array<{ id: string; name: string; level: number; color: string | null }>
  >
> {
  try {
    await requireAuth();

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        level: true,
        color: true,
      },
      orderBy: {
        level: 'desc',
      },
    });

    return {
      success: true,
      data: roles,
    };
  } catch (error: any) {
    console.error('Get roles error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch roles',
    };
  }
}
