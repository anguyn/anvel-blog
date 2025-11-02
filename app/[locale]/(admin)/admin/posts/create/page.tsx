import { prisma } from '@/libs/prisma';
import {
  getCurrentUser,
  hasMinimumRole,
  hasPermission,
  Permissions,
} from '@/libs/server/rbac';
import { redirect } from 'next/navigation';
import { PostForm } from '@/components/blocks/admin/posts/post-form';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageProps } from '@/types/global';
import AdminLayout from '@/components/layouts/admin-layout';

export const metadata: Metadata = {
  title: 'Create Post | Admin',
  description: 'Create a new blog post',
};

export default async function CreatePostPage({
  searchParams,
  params,
}: PageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/posts/create`);
  }

  const canCreate = await hasPermission(Permissions.POSTS_CREATE);
  const isValidRole = await hasMinimumRole(50);

  if (!canCreate || !isValidRole) {
    redirect(`/${locale}/admin/posts`);
  }

  // Get categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      language: true,
    },
  });

  const typedCategories = categories as {
    id: string;
    name: string;
    slug: string;
    language: 'vi' | 'en';
  }[];

  // Get tags
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-6xl px-4 py-2">
        <PostForm categories={typedCategories} tags={tags} />
      </div>
    </AdminLayout>
  );
}
