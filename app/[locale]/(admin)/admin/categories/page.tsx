import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasPermission, Permissions } from '@/libs/server/rbac';
import { PageProps } from '@/types/global';
import { CategoriesManagement } from '@/components/blocks/admin/categories/render';
import AdminLayout from '@/components/layouts/admin-layout';

export const metadata: Metadata = {
  title: 'Categories Management | Admin',
  description: 'Manage your blog categories',
};

export default async function AdminCategoriesPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/categories`);
  }

  const canManageCategories = await hasPermission(
    Permissions.CATEGORIES_MANAGE,
  );

  if (!canManageCategories) {
    redirect(`/${locale}/forbidden`);
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-2">
        <CategoriesManagement locale={locale as string} user={user} />
      </div>
    </AdminLayout>
  );
}
