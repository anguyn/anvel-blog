import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/libs/services/config.service';
import { getCurrentUser, requireMinimumRole } from '@/libs/server/rbac';

// POST /api/admin/configs/reload - Clear cache and reload configs
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    await requireMinimumRole(100);

    const { key } = await req.json();

    if (key) {
      await ConfigService.reload(key);
    } else {
      ConfigService.clearCache();
    }

    return NextResponse.json({
      success: true,
      message: key ? `Config ${key} reloaded` : 'All configs reloaded',
    });
  } catch (error) {
    console.error('Error reloading configs:', error);
    return NextResponse.json(
      { error: 'Failed to reload configs' },
      { status: 500 },
    );
  }
}
