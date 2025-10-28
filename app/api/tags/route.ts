// Chưa translate
import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { getApiTranslations } from '@/i18n/i18n';
import { hasPermission, requireAuth, Permissions } from '@/libs/server/rbac';
import { z } from 'zod';

export async function GET(request: Request) {
  const { t } = await getApiTranslations(request);

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.type = type.toUpperCase();
    }

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: {
            snippets: true,
            posts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      ...(limit && limit > 0 && limit != -1 ? { take: limit } : {}),
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      { error: t.api.errors.fetchTagsFailed },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const canManageTags = await hasPermission(Permissions.TAGS_MANAGE);
    if (!canManageTags) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();

    // Validate
    const schema = z.object({
      name: z.string().min(1, 'Name is required').max(50),
      slug: z.string().min(1).max(50).optional(),
      type: z
        .enum(['LANGUAGE', 'TOPIC', 'TECHNOLOGY', 'CATEGORY'])
        .default('TOPIC'),
      color: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
    });

    const data = schema.parse(body);

    // Generate slug if not provided
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    // Check if slug already exists
    const existing = await prisma.tag.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Tag with this slug already exists' },
        { status: 400 },
      );
    }

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug,
        type: data.type,
        color: data.color || '#3B82F6',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        color: true,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error('Create tag error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', message: (error as z.ZodError).message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
