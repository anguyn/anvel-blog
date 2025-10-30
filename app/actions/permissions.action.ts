'use server';

import { prisma } from '@/libs/prisma';
import { requirePermission } from '@/libs/server/auth';
import { revalidatePath } from 'next/cache';
import {
  Permission,
  PermissionFormData,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface PermissionFilters {
  search?: string;
  resource?: string;
  page?: number;
  limit?: number;
}

// ============================================
// GET PERMISSIONS
// ============================================
export async function getPermissions(
  filters: PermissionFilters = {},
): Promise<ApiResponse<PaginatedResponse<Permission>>> {
  try {
    await requirePermission('settings:manage');

    const { search = '', resource = 'all', page = 1, limit = 20 } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (resource !== 'all') {
      where.resource = resource;
    }

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        include: {
          _count: {
            select: {
              roles: true,
            },
          },
        },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.permission.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: permissions as Permission[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  } catch (error: any) {
    console.error('Get permissions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch permissions',
    };
  }
}

// ============================================
// GET PERMISSION RESOURCES (for filter)
// ============================================
export async function getPermissionResources(): Promise<ApiResponse<string[]>> {
  try {
    await requirePermission('settings:manage');

    const resources = await prisma.permission.findMany({
      select: { resource: true },
      distinct: ['resource'],
      orderBy: { resource: 'asc' },
    });

    return {
      success: true,
      data: resources.map(r => r.resource),
    };
  } catch (error: any) {
    console.error('Get resources error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch resources',
    };
  }
}

// ============================================
// CREATE PERMISSION
// ============================================
export async function createPermission(
  data: PermissionFormData,
): Promise<ApiResponse<Permission>> {
  try {
    const session = await requirePermission('settings:manage');

    // Check if permission already exists
    const existing = await prisma.permission.findFirst({
      where: {
        OR: [
          { name: data.name },
          {
            resource: data.resource,
            action: data.action,
          },
        ],
      },
    });

    if (existing) {
      if (existing.name === data.name) {
        return {
          success: false,
          error: 'Permission name already exists',
        };
      }
      return {
        success: false,
        error: `Permission ${data.resource}:${data.action} already exists`,
      };
    }

    const permission = await prisma.permission.create({
      data: {
        name: data.name,
        resource: data.resource,
        action: data.action,
        description: data.description || null,
      },
      include: {
        _count: {
          select: {
            roles: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'PERMISSION_CREATED',
        entity: 'permission',
        entityId: permission.id,
        metadata: {
          permissionName: permission.name,
          resource: permission.resource,
          action: permission.action,
        },
        importance: 'INFO',
        retentionDays: 180,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/permissions');

    return {
      success: true,
      data: permission as Permission,
      message: 'Permission created successfully',
    };
  } catch (error: any) {
    console.error('Create permission error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create permission',
    };
  }
}

// ============================================
// UPDATE PERMISSION
// ============================================
export async function updatePermission(
  permissionId: string,
  data: PermissionFormData,
): Promise<ApiResponse<Permission>> {
  try {
    const session = await requirePermission('settings:manage');

    const existing = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Permission not found',
      };
    }

    // Check for duplicates
    const duplicate = await prisma.permission.findFirst({
      where: {
        id: { not: permissionId },
        OR: [
          { name: data.name },
          {
            resource: data.resource,
            action: data.action,
          },
        ],
      },
    });

    if (duplicate) {
      if (duplicate.name === data.name) {
        return {
          success: false,
          error: 'Permission name already exists',
        };
      }
      return {
        success: false,
        error: `Permission ${data.resource}:${data.action} already exists`,
      };
    }

    const permission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        name: data.name,
        resource: data.resource,
        action: data.action,
        description: data.description || null,
      },
      include: {
        _count: {
          select: {
            roles: true,
          },
        },
      },
    });

    // Update security stamp for all users with roles that have this permission
    const rolesWithPermission = await prisma.rolePermission.findMany({
      where: { permissionId },
      select: { roleId: true },
    });

    if (rolesWithPermission.length > 0) {
      await prisma.user.updateMany({
        where: {
          roleId: {
            in: rolesWithPermission.map(r => r.roleId),
          },
        },
        data: {
          securityStamp: require('crypto').randomBytes(32).toString('hex'),
        },
      });
    }

    // Log activity
    const metadata = {
      permissionName: permission.name,
      changes: data,
      affectedRoles: rolesWithPermission.length,
    };

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'PERMISSION_UPDATED',
        entity: 'permission',
        entityId: permission.id,
        metadata: JSON.stringify(metadata),
        importance: 'WARNING',
        retentionDays: 180,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/permissions');

    return {
      success: true,
      data: permission as Permission,
      message: 'Permission updated successfully',
    };
  } catch (error: any) {
    console.error('Update permission error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update permission',
    };
  }
}

// ============================================
// DELETE PERMISSION
// ============================================
export async function deletePermission(
  permissionId: string,
): Promise<ApiResponse> {
  try {
    const session = await requirePermission('settings:manage');

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        _count: {
          select: {
            roles: true,
          },
        },
      },
    });

    if (!permission) {
      return {
        success: false,
        error: 'Permission not found',
      };
    }

    if (permission._count.roles > 0) {
      return {
        success: false,
        error: `Cannot delete permission assigned to ${permission._count.roles} role(s)`,
      };
    }

    await prisma.permission.delete({
      where: { id: permissionId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'PERMISSION_DELETED',
        entity: 'permission',
        entityId: permissionId,
        metadata: {
          permissionName: permission.name,
          resource: permission.resource,
          action: permission.action,
        },
        importance: 'WARNING',
        retentionDays: 180,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin/permissions');

    return {
      success: true,
      message: 'Permission deleted successfully',
    };
  } catch (error: any) {
    console.error('Delete permission error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete permission',
    };
  }
}
