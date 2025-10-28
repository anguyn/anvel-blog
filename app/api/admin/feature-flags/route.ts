import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireMinimumRole } from '@/libs/server/rbac';
import { prisma } from '@/libs/prisma';

// GET /api/admin/feature-flags - Get all feature flags
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    await requireMinimumRole(100);

    const flags = await prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 },
    );
  }
}
