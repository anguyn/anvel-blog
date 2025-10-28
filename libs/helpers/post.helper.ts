import slugify from 'slugify';
import { prisma } from '@/libs/prisma';

/** Check user permission */
export async function checkPermission(
  userId: string,
  permission: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
  if (!user?.role) return false;
  return user.role.permissions.some(rp => rp.permission.name === permission);
}

/** Generate unique slug */
export async function generateUniqueSlug(
  title: string,
  postId?: string,
): Promise<string> {
  let slug = slugify(title, { lower: true, strict: true });
  let counter = 0;
  let uniqueSlug = slug;

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug: uniqueSlug },
    });
    if (!existing || existing.id === postId) break;
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}

/** Calculate reading time */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
