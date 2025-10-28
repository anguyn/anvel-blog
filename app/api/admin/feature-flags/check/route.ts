import { ConfigService } from '@/libs/services/config.service';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/feature-flags/check - Check if feature is enabled
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 },
      );
    }

    const enabled = await ConfigService.isFeatureEnabled(name);

    return NextResponse.json({ name, enabled });
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to check feature flag' },
      { status: 500 },
    );
  }
}
