import { prisma } from '@/libs/prisma';
import {
  getCurrentUser,
  hasPermission,
  Permissions,
  canPerformAction,
} from '@/libs/server/rbac';
import { redirect, notFound } from 'next/navigation';
import { PostForm } from '@/components/blocks/admin/posts/post-form';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import AdminLayout from '@/components/layouts/admin-layout';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

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

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;

  // Check auth & permissions
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?callbackUrl=/admin/posts/${id}/edit`);
  }

  // Get post with all relations
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

  // Check if user can edit this post
  const canEdit = await canPerformAction(
    Permissions.POSTS_UPDATE,
    post.authorId,
  );

  if (!canEdit) {
    redirect('/admin/posts');
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
        <div className="mb-6">
          <Link
            href="/admin/posts"
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center text-sm"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Posts
          </Link>
          <h1 className="text-3xl font-bold">Edit Post</h1>
          <p className="text-muted-foreground mt-1">Update your post content</p>
        </div>

        <PostForm post={post as any} categories={typedCategories} tags={tags} />
      </div>
    </AdminLayout>
  );
}
