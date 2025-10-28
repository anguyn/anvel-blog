import { NextResponse } from 'next/server';
import { auth } from '@/libs/server/auth';
import { prisma } from '@/libs/prisma';
import slugify from 'slugify';
import { getApiTranslations } from '@/i18n/i18n';

export async function GET(request: Request) {
  const { t } = await getApiTranslations(request);

  try {
    const { searchParams } = new URL(request.url);
    const languageSlug = searchParams.get('language');
    const tagSlug = searchParams.get('tag');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { isPublic: true };

    if (languageSlug) {
      where.language = {
        slug: languageSlug,
      };
    }

    if (userId) {
      where.userId = userId;
      delete where.isPublic;
    }

    if (tagSlug) {
      where.tags = {
        some: {
          tag: {
            slug: tagSlug,
            type: 'TOPIC',
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };

    if (sortBy === 'viewed') {
      orderBy = { viewCount: 'desc' };
    } else if (sortBy === 'liked') {
      orderBy = { favorites: { _count: 'desc' } };
    }

    const [snippets, total] = await Promise.all([
      prisma.snippet.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          language: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.snippet.count({ where }),
    ]);

    return NextResponse.json({
      snippets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get snippets error:', error);
    return NextResponse.json(
      { error: t.api.errors.fetchSnippetsFailed },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, code, languageId, tags, isPublic, complexity } =
      body;

    if (!title || !code || !languageId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const language = await prisma.language.findUnique({
      where: { id: languageId },
    });

    if (!language) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    let slug = slugify(title, { lower: true, strict: true });
    let slugExists = await prisma.snippet.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${slugify(title, { lower: true, strict: true })}-${counter}`;
      slugExists = await prisma.snippet.findUnique({ where: { slug } });
      counter++;
    }

    const tagConnections = [];

    if (tags?.languageTag) {
      const langTagSlug = slugify(tags.languageTag, {
        lower: true,
        strict: true,
      });

      let languageTag = await prisma.tag.findUnique({
        where: { slug: langTagSlug },
      });

      if (!languageTag) {
        languageTag = await prisma.tag.create({
          data: {
            name: tags.languageTag,
            slug: langTagSlug,
            type: 'LANGUAGE',
          },
        });
      }

      tagConnections.push({
        tag: {
          connect: { id: languageTag.id },
        },
      });
    }

    if (tags?.topicTags && Array.isArray(tags.topicTags)) {
      for (const tagName of tags.topicTags) {
        const tagSlug = slugify(tagName, { lower: true, strict: true });

        let tag = await prisma.tag.findUnique({
          where: { slug: tagSlug },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug: tagSlug,
              type: 'TOPIC',
            },
          });
        }

        tagConnections.push({
          tag: {
            connect: { id: tag.id },
          },
        });
      }
    }

    const snippet = await prisma.snippet.create({
      data: {
        title,
        description,
        code,
        languageId,
        complexity,
        isPublic: isPublic !== false,
        slug,
        userId: session.user.id,
        tags: {
          create: tagConnections,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        language: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    console.error('Create snippet error:', error);
    return NextResponse.json(
      { error: 'Failed to create snippet' },
      { status: 500 },
    );
  }
}
