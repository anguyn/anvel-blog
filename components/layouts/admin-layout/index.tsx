import { redirect } from 'next/navigation';
import { DashboardLayoutClient } from './client';
import { DashboardHeader, DashboardHeaderProps } from './header';
import { ScrollToTop } from '@/components/common/scroll-to-top';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const header: DashboardHeaderProps = {};

  return (
    <DashboardLayoutClient>
      {children}
      <ScrollToTop />
    </DashboardLayoutClient>
  );
}
