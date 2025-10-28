import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { getCurrentUser, requireMinimumRole } from '@/libs/server/rbac';

// PUT /api/admin/feature-flags/[name] - Toggle feature flag
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  try {
    const params = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    await requireMinimumRole(100);

    const { enabled, percentage, rules } = await req.json();

    const flag = await prisma.featureFlag.update({
      where: { name: params.name },
      data: {
        enabled,
        percentage,
        rules,
      },
    });

    return NextResponse.json({ flag });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 },
    );
  }
}
