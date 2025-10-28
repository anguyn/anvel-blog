import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { auth } from '@/libs/server/auth';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ isFavorited: false });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_snippetId: {
          userId: session.user.id,
          snippetId: params.id,
        },
      },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    return NextResponse.json({ isFavorited: false });
  }
}
