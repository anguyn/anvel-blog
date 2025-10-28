import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/libs/services/config.service';
import { getCurrentUser, requireMinimumRole } from '@/libs/server/rbac';

// PUT /api/admin/configs/[key] - Update config
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  try {
    const params = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    await requireMinimumRole(100);

    const { value, reason } = await req.json();
    const key = params.key;

    await ConfigService.set(key, value, user.id, reason);

    return NextResponse.json({
      success: true,
      message: `Config ${key} updated successfully`,
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 },
    );
  }
}
