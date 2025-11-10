import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { requireAuth, hasPermission, Permissions } from '@/libs/server/rbac';
import { z } from 'zod';

// GET /api/category/[id] - Get single category with translations
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            language: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            language: true,
          },
        },
        translations: {
          orderBy: {
            language: 'asc',
          },
        },
        _count: {
          select: {
            posts: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PUT /api/category/[id] - Update category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const canManageCategories = await hasPermission(
      Permissions.CATEGORIES_MANAGE,
    );
    if (!canManageCategories) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 },
      );
    }

    const body = await request.json();

    const schema = z.object({
      name: z.string().min(1, 'Name is required').max(100).optional(),
      slug: z.string().min(1).max(100).optional(),
      description: z.string().optional().nullable(),
      icon: z.string().optional().nullable(),
      color: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional()
        .nullable(),
      parentId: z.string().optional().nullable(),
      language: z.enum(['vi', 'en']).optional(),
      isActive: z.boolean().optional(),
      translations: z
        .array(
          z.object({
            id: z.string().optional(),
            language: z.enum(['vi', 'en']),
            name: z.string().min(1).max(100),
            description: z.string().optional().nullable(),
          }),
        )
        .optional(),
    });

    const data = schema.parse(body);

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.category.findFirst({
        where: {
          slug: data.slug,
          language: data.language || existing.language,
          id: { not: id },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Category with this slug already exists in this language' },
          { status: 400 },
        );
      }
    }

    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 },
        );
      }

      if (data.parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parent) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 404 },
          );
        }

        if (parent.parentId === id) {
          return NextResponse.json(
            { error: 'Cannot set a child category as parent' },
            { status: 400 },
          );
        }
      }
    }

    const category = await prisma.$transaction(async tx => {
      const updated = await tx.category.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.slug && { slug: data.slug }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.parentId !== undefined && { parentId: data.parentId }),
          ...(data.language && { language: data.language }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      if (data.translations && data.translations.length > 0) {
        for (const trans of data.translations) {
          await tx.categoryTranslation.upsert({
            where: {
              categoryId_language: {
                categoryId: id,
                language: trans.language,
              },
            },
            update: {
              name: trans.name,
              description: trans.description,
            },
            create: {
              categoryId: id,
              language: trans.language,
              name: trans.name,
              description: trans.description,
            },
          });
        }
      }

      return await tx.category.findUnique({
        where: { id },
        include: {
          translations: true,
          _count: {
            select: {
              posts: true,
              children: true,
            },
          },
        },
      });
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.activityLog
      .create({
        data: {
          userId: session.user.id!,
          action: 'UPDATE',
          entity: 'category',
          entityId: id,
          metadata: {
            name: category?.name,
            changes: data,
          },
          importance: 'INFO',
          retentionDays: 30,
          expiresAt,
        },
      })
      .catch(() => {});

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Update category error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', errors: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE /api/category/[id] - Delete category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const canManageCategories = await hasPermission(
      Permissions.CATEGORIES_MANAGE,
    );
    if (!canManageCategories) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 },
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with child categories',
          details: `This category has ${category._count.children} child categories`,
        },
        { status: 400 },
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await prisma.activityLog
      .create({
        data: {
          userId: session.user.id!,
          action: 'DELETE',
          entity: 'category',
          entityId: id,
          metadata: {
            name: category.name,
            postsCount: category._count.posts,
          },
          importance: 'WARNING',
          retentionDays: 90,
          expiresAt,
        },
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
