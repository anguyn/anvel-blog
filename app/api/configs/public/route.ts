import { NextResponse } from 'next/server';
import { ConfigService } from '@/libs/services/config.service';

// GET /api/configs/public
export async function GET() {
  try {
    const configs = await ConfigService.getPublicConfigs();
    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Error fetching public configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configs' },
      { status: 500 }
    );
  }
}