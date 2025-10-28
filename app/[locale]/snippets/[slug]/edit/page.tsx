import { MainLayout } from '@/components/layouts/main-layout';
import { SnippetEditBlock } from '@/components/blocks/pages/snippets/edit/render';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Snippet } from '@/types';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/libs/server/auth';
import { prisma } from '@/libs/prisma';
import { Metadata } from 'next';

async function getSnippet(slug: string): Promise<Snippet | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/snippets/${slug}`,
      {
        cache: 'no-store',
      },
    );

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale == 'en' ? 'Edit Snippet' : 'Chỉnh Sửa Đoạn Mã',
  };
}

export default async function EditSnippetPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/snippets/${slug}/edit`);
  }

  const snippet = await getSnippet(slug);

  if (!snippet) {
    notFound();
  }

  if (snippet.userId !== session.user.id) {
    redirect(`/${locale}/snippets/${slug}`);
  }

  const languages = await prisma.language.findMany({
    where: { isActive: true },
    orderBy: { popularity: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
    },
  });

  return (
    <MainLayout locale={locale}>
      <SnippetEditBlock
        title={locale == 'en' ? 'Edit Snippet' : 'Chỉnh Sửa Đoạn Mã'}
        snippet={snippet}
        languages={languages}
        locale={locale}
      />
    </MainLayout>
  );
}
