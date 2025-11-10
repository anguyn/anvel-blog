import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { requirePermission } from '@/libs/server/auth';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('users:read');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as any;
    const roleId = searchParams.get('roleId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (roleId) where.roleId = roleId;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          role: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              sessions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const sanitizedUsers = users.map(user => ({
      ...user,
      password: undefined,
      twoFactorSecret: undefined,
      pending2FASecret: undefined,
    }));

    return NextResponse.json({
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 },
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('users:manage');

    const createUserSchema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
      username: z.string().min(3).optional(),
      password: z.string().min(6),
      roleId: z.string().optional(),
      status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED']).default('ACTIVE'),
    });

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          ...(validatedData.username
            ? [{ username: validatedData.username }]
            : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 400 },
      );
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    let roleId = validatedData.roleId;
    if (!roleId) {
      const defaultRole = await prisma.role.findUnique({
        where: { name: 'USER' },
      });
      roleId = defaultRole?.id;
    }

    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
        roleId,
        emailVerified: new Date(),
      },
      include: {
        role: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_CREATED',
        entity: 'user',
        entityId: user.id,
        metadata: { email: user.email },
        importance: 'INFO',
        retentionDays: 90,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        password: undefined,
      },
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 },
    );
  }
}
