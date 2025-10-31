import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PageProps } from '@/types/global';
import { getCurrentUser, hasMinimumRole } from '@/libs/server/rbac';

export const metadata: Metadata = {
  title: 'Redirecting Management | Admin',
  description: 'Manage your blog categories',
};

export default async function AdminRootPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin`);
  }

  const isValidRole = await hasMinimumRole(50);

  if (!isValidRole) {
    redirect(`/${locale}/forbidden`);
  }

  redirect(`/${locale}/admin/dashboard`);
}
