import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/libs/prisma';
import { ConfigTabs } from '@/components/blocks/admin/configs/config-tabs';
import { Card, CardContent } from '@/components/common/card';
import { RefreshCw, Database } from 'lucide-react';
import { ReloadCacheButton } from '@/components/blocks/admin/configs/reload-cache-button';
import AdminLayout from '@/components/layouts/admin-layout';
import { PageProps } from '@/types/global';
import {
  getCurrentUser,
  hasMinimumRole,
  hasPermission,
  Permissions,
} from '@/libs/server/rbac';

async function getConfigsData() {
  const [allConfigs, features, metadata] = await Promise.all([
    prisma.systemConfig.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    }),
    prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.appMetadata.findMany({
      orderBy: { locale: 'asc' },
    }),
  ]);

  // Group configs by category
  const groupedConfigs = allConfigs.reduce(
    (acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  return {
    configs: groupedConfigs,
    features,
    metadata,
  };
}

export default async function ConfigsPage({ params }: PageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin/configs`);
  }

  const isValidRole = hasMinimumRole(100);

  if (!isValidRole) {
    redirect(`/${locale}/forbidden`);
  }

  const { configs, features, metadata } = await getConfigsData();

  return (
    <AdminLayout>
      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="bg-card sticky top-16 z-10 border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="text-primary h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    System Configuration
                  </h1>
                  <p className="text-muted-foreground leading-normal">
                    Manage application settings and features
                  </p>
                </div>
              </div>
              <ReloadCacheButton />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {Object.values(configs).flat().length}
                  </div>
                  <p className="text-muted-foreground text-xs leading-normal">
                    System Configurations
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{features.length}</div>
                  <p className="text-muted-foreground text-xs">Feature Flags</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{metadata.length}</div>
                  <p className="text-muted-foreground text-xs leading-normal">
                    App Metadata
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<ConfigsLoading />}>
            <ConfigTabs
              configs={configs}
              features={features}
              metadata={metadata}
            />
          </Suspense>
        </div>
      </div>
    </AdminLayout>
  );
}

function ConfigsLoading() {
  return (
    <AdminLayout>
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground leading-normal">
            Loading configurations...
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
