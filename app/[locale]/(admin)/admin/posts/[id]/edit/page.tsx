import { prisma } from '@/libs/prisma';
import {
  getCurrentUser,
  hasPermission,
  Permissions,
  canPerformAction,
  hasMinimumRole,
} from '@/libs/server/rbac';
import { redirect, notFound } from 'next/navigation';
import { PostForm } from '@/components/blocks/admin/posts/post-form';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import AdminLayout from '@/components/layouts/admin-layout';
import { PageProps } from '@/types/global';

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: { title: true },
  });

  return {
    title: post ? `Edit: ${post.title} | Admin` : 'Edit Post | Admin',
    description: 'Edit blog post',
  };
}

export default async function EditPostPage({
  searchParams,
  params,
}: PageProps) {
  const { locale, id } = await params;

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/posts/${id}/edit`);
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
            },
          },
        },
      },
      media: {
        include: {
          media: {
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              alt: true,
              type: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const isValidRole = await hasMinimumRole(50);
  const canEdit = await canPerformAction(
    Permissions.POSTS_UPDATE,
    post.authorId,
  );

  if (!canEdit || !isValidRole) {
    redirect(`/${locale}/admin/posts`);
  }

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
        <PostForm post={post as any} categories={typedCategories} tags={tags} />
      </div>
    </AdminLayout>
  );
}
