import { Suspense } from 'react';
import { prisma } from '@/libs/prisma';
import {
  getCurrentUser,
  hasMinimumRole,
  hasPermission,
  Permissions,
} from '@/libs/server/rbac';
import { redirect } from 'next/navigation';
import { PostsListClient } from '@/components/blocks/admin/posts/post-list';
import { Metadata } from 'next';
import { PageProps } from '@/types/global';
import AdminLayout from '@/components/layouts/admin-layout';

export const metadata: Metadata = {
  title: 'Posts Management | Admin',
  description: 'Manage your blog posts',
};

export default async function AdminPostsPage({
  searchParams,
  params,
}: PageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/posts`);
  }

  const isValidRole = hasMinimumRole(50);
  const canViewPosts = await hasPermission(Permissions.POSTS_READ);

  if (!canViewPosts || !isValidRole) {
    redirect(`/${locale}/forbidden`);
  }

  // Get categories for filter
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  // Get tags for filter
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    take: 50,
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  // Check permissions for actions
  const canCreate = await hasPermission(Permissions.POSTS_CREATE);
  const canUpdate = await hasPermission(Permissions.POSTS_UPDATE);
  const canDelete = await hasPermission(Permissions.POSTS_DELETE);
  const canPublish = await hasPermission(Permissions.POSTS_PUBLISH);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-2">
        <Suspense fallback={<div>Loading...</div>}>
          <PostsListClient
            categories={categories}
            tags={tags}
            user={user}
            permissions={{
              canCreate,
              canUpdate,
              canDelete,
              canPublish,
            }}
          />
        </Suspense>
      </div>
    </AdminLayout>
  );
}
