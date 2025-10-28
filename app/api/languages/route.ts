import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { getApiTranslations } from '@/i18n/i18n';

export async function GET(request: Request) {
  const { t } = await getApiTranslations(request);

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const languages = await prisma.language.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        _count: {
          select: {
            snippets: {
              where: {
                // isPublic: true,
              },
            },
          },
        },
      },
      orderBy: {
        popularity: 'desc',
      },
      take: limit,
    });

    return NextResponse.json(languages);
  } catch (error) {
    console.error('Get languages error:', error);
    return NextResponse.json(
      { error: t.api.errors.fetchLanguagesFailed },
      { status: 500 },
    );
  }
}
