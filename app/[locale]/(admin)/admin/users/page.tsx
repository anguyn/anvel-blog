import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasMinimumRole } from '@/libs/server/rbac';
import { PageProps } from '@/types/global';
import AdminLayout from '@/components/layouts/admin-layout';
import { AdminUserRender } from '@/components/blocks/admin/users/render';
// import { getAllRoles, getUsers } from '@/app/actions/users.action';

export const metadata: Metadata = {
  title: 'User Management | Admin',
  description: 'Manage blog dashboard',
};

export default async function AdminUserPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/users`);
  }

  const isValidRole = hasMinimumRole(50);

  if (!isValidRole) {
    redirect(`/${locale}/forbidden`);
  }

  //   const [usersResult, rolesResult] = await Promise.all([
  //     getUsers({ page: 1, limit: 10 }),
  //     getRoles(),
  //   ]);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-2">
        <AdminUserRender locale={locale as string} />
      </div>
    </AdminLayout>
  );
}
