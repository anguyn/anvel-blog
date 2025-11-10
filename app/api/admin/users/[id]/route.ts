import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { requirePermission } from '@/libs/server/auth';
import { z } from 'zod';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    const session = await requirePermission('users:manage');

    const url = new URL(request.url);

    if (!userId || userId === 'users') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    const updateUserSchema = z.object({
      email: z.string().email().optional(),
      name: z.string().min(2).optional(),
      username: z.string().min(3).optional(),
      bio: z.string().optional(),
      roleId: z.string().optional(),
      status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED']).optional(),
      password: z.string().min(6).optional(),
    });

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    if (userId === session.user.id) {
      if (validatedData.roleId || validatedData.status) {
        return NextResponse.json(
          { error: 'Cannot change your own role or status' },
          { status: 403 },
        );
      }
    }

    if (validatedData.email || validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(validatedData.email
                  ? [{ email: validatedData.email }]
                  : []),
                ...(validatedData.username
                  ? [{ username: validatedData.username }]
                  : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email or username already exists' },
          { status: 400 },
        );
      }
    }

    const updateData: any = { ...validatedData };
    if (validatedData.password) {
      const bcrypt = await import('bcryptjs');
      updateData.password = await bcrypt.hash(validatedData.password, 10);
      updateData.passwordChangedAt = new Date();
      updateData.securityStamp = require('crypto')
        .randomBytes(16)
        .toString('hex');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_UPDATED',
        entity: 'user',
        entityId: user.id,
        metadata: { changes: Object.keys(validatedData) },
        importance: 'INFO',
        retentionDays: 90,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        password: undefined,
        twoFactorSecret: undefined,
      },
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/users/:id - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;

    const session = await requirePermission('users:manage');

    const url = new URL(request.url);

    if (!userId || userId === 'users') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role?.name === 'ADMIN' && user.role?.isSystem) {
      const adminCount = await prisma.user.count({
        where: {
          role: { name: 'ADMIN' },
          id: { not: userId },
        },
      });

      if (adminCount === 0) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin' },
          { status: 403 },
        );
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_DELETED',
        entity: 'user',
        entityId: userId,
        metadata: { email: user.email },
        importance: 'WARNING',
        retentionDays: 180,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 },
    );
  }
}
