import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasMinimumRole } from '@/libs/server/rbac';
import { PageProps } from '@/types/global';
import AdminLayout from '@/components/layouts/admin-layout';
import { DashboardManagement } from '@/components/blocks/admin/dashboard/render';

export const metadata: Metadata = {
  title: 'Dashboard Management | Admin',
  description: 'Manage your blog dashboard',
};

export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/dashboard`);
  }

  const isValidRole = await hasMinimumRole(50);

  if (!isValidRole) {
    redirect(`/${locale}/forbidden`);
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-2">
        <DashboardManagement locale={locale as string} />
      </div>
    </AdminLayout>
  );
}
