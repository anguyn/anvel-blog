import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PageProps } from '@/types/global';
import { getCurrentUser } from '@/libs/server/rbac';

export const metadata: Metadata = {
  title: 'Categories Management | Admin',
  description: 'Manage your blog categories',
};

export default async function AdminRootPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/categories`);
  }

  redirect(`/${locale}/admin/dashboard`);
}
