import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/libs/services/config.service';

// GET /api/configs/app-metadata - Get app metadata
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const metadata = await ConfigService.getAppMetadata(locale);

    if (!metadata) {
      return NextResponse.json(
        { error: 'Metadata not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ metadata });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 },
    );
  }
}
