import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { requireAuth, hasPermission, Permissions } from '@/libs/server/rbac';
import { z } from 'zod';

const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
type Language = (typeof SUPPORTED_LANGUAGES)[number];

// POST /api/category - Create new category
export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const canManageCategories = await hasPermission(
      Permissions.CATEGORIES_MANAGE,
    );
    if (!canManageCategories) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();

    // Validate
    const schema = z.object({
      name: z.string().min(1, 'Name is required').max(100),
      slug: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
      parentId: z.string().optional(),
      language: z.enum(['vi', 'en']), // Required
      isActive: z.boolean().optional(),
    });

    const data = schema.parse(body);

    // Generate slug if not provided
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    // Check if slug already exists in this language
    const existing = await prisma.category.findFirst({
      where: {
        slug,
        language: data.language,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this slug already exists in this language' },
        { status: 400 },
      );
    }

    // If parentId provided, check if parent exists
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
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        icon: data.icon,
        color: data.color || '#3B82F6',
        parentId: data.parentId,
        language: data.language,
        isActive: data.isActive ?? true,
      },
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

    // Auto-create translation for other language
    const targetLanguage = data.language === 'vi' ? 'en' : 'vi';

    try {
      // Queue translation job (you can implement this later)
      // For now, create empty translation
      await prisma.categoryTranslation.create({
        data: {
          categoryId: category.id,
          language: targetLanguage,
          name: data.name, // Will be translated later
          description: data.description || null,
        },
      });
    } catch (err) {
      console.error('Failed to create translation:', err);
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);

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

// GET /api/category - List categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const parentId = searchParams.get('parentId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const language = (searchParams.get('language') as Language) || 'vi';

    const where: any = {
      language, // Filter by language
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          translations: {
            some: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    if (parentId !== null) {
      where.parentId = parentId || null;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
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

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
