import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface RouteParams {
  params: Promise<{
    path: string[];
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { path } = await params;
    const imagePath = path.join('/');

    if (imagePath.includes('..') || imagePath.includes('\\')) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    const r2Url = `${process.env.R2_PUBLIC_URL}/${imagePath}`;

    const response = await fetch(r2Url, {
      cf: {
        cacheTtl: 31536000,
        cacheEverything: true,
      },
    } as RequestInit);

    if (!response.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
        'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
