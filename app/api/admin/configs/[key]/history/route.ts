import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { getCurrentUser, requireMinimumRole } from '@/libs/server/rbac';

// GET /api/admin/configs/[key]/history - Get config change history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  try {
    const params = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    await requireMinimumRole(100);

    const history = await prisma.configHistory.findMany({
      where: { configKey: params.key },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching config history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 },
    );
  }
}
