import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { auth } from '@/libs/server/auth';
import { getApiTranslations } from '@/i18n/i18n';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { t: translate } = await getApiTranslations(request);
  const t = translate.api.snippet;
  const params = await context.params;

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: t.unauthorized }, { status: 401 });
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
    });

    if (!snippet) {
      return NextResponse.json({ error: t.notFound }, { status: 404 });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        snippetId: params.id,
      },
    });

    return NextResponse.json(favorite);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: t.alreadyFavorited }, { status: 400 });
    }
    console.error('Favorite error:', error);
    return NextResponse.json({ error: t.favoriteFailed }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { t: translate } = await getApiTranslations(request);
  const t = translate.api.snippet;
  const params = await context.params;

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: t.unauthorized }, { status: 401 });
    }

    await prisma.favorite.delete({
      where: {
        userId_snippetId: {
          userId: session.user.id,
          snippetId: params.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unfavorite error:', error);
    return NextResponse.json({ error: t.unfavoriteFailed }, { status: 500 });
  }
}
