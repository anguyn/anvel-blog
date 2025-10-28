import { cookies } from 'next/headers';
import { LocaleProps } from '@/i18n/config';
import slugify from 'slugify';
import { prisma } from '@/libs/prisma';

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
