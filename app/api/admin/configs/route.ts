import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/libs/services/config.service';
import { prisma } from '@/libs/prisma';
import { getCurrentUser, requireMinimumRole } from '@/libs/server/rbac';

// GET /api/admin/configs - Get all configs
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    await requireMinimumRole(100);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let configs;
    if (category) {
      configs = await ConfigService.getByCategory(category);
    } else {
      // Get all configs grouped by category
      const allConfigs = await prisma.systemConfig.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });

      configs = allConfigs.reduce(
        (acc, config) => {
          if (!acc[config.category]) {
            acc[config.category] = [];
          }
          acc[config.category].push(config);
          return acc;
        },
        {} as Record<string, any[]>,
      );
    }

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Error fetching configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configs' },
      { status: 500 },
    );
  }
}
