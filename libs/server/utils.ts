import { cookies } from 'next/headers';
import { LocaleProps } from '@/i18n/config';
import slugify from 'slugify';
import { prisma } from '@/libs/prisma';
import { jwtVerify } from 'jose';

export async function getServerLocale(): Promise<LocaleProps> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value as LocaleProps;
  return locale && ['en', 'vi'].includes(locale) ? locale : 'en';
}

export async function generateUniqueSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  let slug = slugify(title, { lower: true, strict: true });
  let counter = 1;

  const where = excludeId ? { slug, id: { not: excludeId } } : { slug };

  while (await prisma.snippet.findFirst({ where })) {
    slug = `${slugify(title, { lower: true, strict: true })}-${counter}`;
    counter++;
    where.slug = slug;
  }

  return slug;
}

export async function upsertTag(name: string, type: 'TOPIC' | 'LANGUAGE') {
  const slug = slugify(name, { lower: true, strict: true });

  return await prisma.tag.upsert({
    where: { slug },
    update: {},
    create: { name, slug, type },
  });
}

export async function createTagConnections(tags: string[], language?: string) {
  const connections = [];

  for (const tagName of tags) {
    const tag = await upsertTag(tagName, 'TOPIC');
    connections.push({ tag: { connect: { id: tag.id } } });
  }

  if (language) {
    const langTag = await upsertTag(language, 'LANGUAGE');
    connections.push({ tag: { connect: { id: langTag.id } } });
  }

  return connections;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.POST_PASSWORD_SECRET || 'your-secret-key-change-in-production',
);

interface PostAccessPayload {
  postId: string;
  slug: string;
}

/**
 * Verify if user has access to password-protected post
 * Token can be reused multiple times within 24 hours
 */
export async function verifyPostAccess(
  slug: string,
): Promise<{ hasAccess: boolean; payload?: PostAccessPayload }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(`post_access_${slug}`)?.value;

    if (!token) {
      return { hasAccess: false };
    }

    // Verify JWT - checks signature and expiration
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Type guard: validate payload has required fields
    if (
      typeof payload.slug !== 'string' ||
      typeof payload.postId !== 'string'
    ) {
      console.error('Invalid token payload structure');
      return { hasAccess: false };
    }

    // Verify the token is for the correct post
    if (payload.slug !== slug) {
      return { hasAccess: false };
    }

    return {
      hasAccess: true,
      payload: payload as unknown as PostAccessPayload,
    };
  } catch (error) {
    // Token expired, invalid signature, or malformed
    console.error('Token verification failed:', error);
    return { hasAccess: false };
  }
}

/**
 * Clear post access token (optional - for manual logout)
 */
export async function clearPostAccess(slug: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(`post_access_${slug}`);
  } catch (error) {
    console.error('Failed to clear post access:', error);
  }
}
