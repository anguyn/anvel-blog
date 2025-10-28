'use server';

import { revalidatePath } from 'next/cache';
import { ConfigService } from '@/libs/services/config.service';
import { prisma } from '@/libs/prisma';
import { getCurrentUser, requireMinimumRole } from '@/libs/server/rbac';

export async function getConfigsByCategory(category?: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    await requireMinimumRole(100);

    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    if (category && category !== 'all') {
      const configs = await prisma.systemConfig.findMany({
        where: { category },
        orderBy: { key: 'asc' },
      });
      return { success: true, data: { [category]: configs } };
    }

    const allConfigs = await prisma.systemConfig.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const grouped = allConfigs.reduce(
      (acc, config) => {
        if (!acc[config.category]) {
          acc[config.category] = [];
        }
        acc[config.category].push(config);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return { success: true, data: grouped };
  } catch (error) {
    console.error('Error fetching configs:', error);
    return { success: false, error: 'Failed to fetch configs' };
  }
}

export async function updateConfig(key: string, value: any, reason?: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    await requireMinimumRole(100);

    await ConfigService.set(key, value, user.id, reason);

    revalidatePath('/admin/configs');
    return { success: true, message: 'Config updated successfully' };
  } catch (error) {
    console.error('Error updating config:', error);
    return { success: false, error: 'Failed to update config' };
  }
}

export async function reloadConfigCache(key?: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    await requireMinimumRole(100);

    if (key) {
      await ConfigService.reload(key);
    } else {
      ConfigService.clearCache();
    }

    revalidatePath('/admin/configs');
    return { success: true, message: 'Cache reloaded successfully' };
  } catch (error) {
    console.error('Error reloading cache:', error);
    return { success: false, error: 'Failed to reload cache' };
  }
}

export async function getConfigHistory(configKey: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    await requireMinimumRole(100);

    const history = await prisma.configHistory.findMany({
      where: { configKey },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('Error fetching history:', error);
    return { success: false, error: 'Failed to fetch history' };
  }
}

export async function getAllFeatureFlags() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    await requireMinimumRole(100);

    const flags = await prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });

    return { success: true, data: flags };
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return { success: false, error: 'Failed to fetch feature flags' };
  }
}

export async function updateFeatureFlag(
  name: string,
  data: { enabled: boolean; percentage: number; rules?: any },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    await requireMinimumRole(100);

    const flag = await prisma.featureFlag.update({
      where: { name },
      data,
    });

    revalidatePath('/admin/configs');
    return { success: true, data: flag };
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return { success: false, error: 'Failed to update feature flag' };
  }
}

export async function getAllAppMetadata() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    await requireMinimumRole(100);

    const metadata = await prisma.appMetadata.findMany({
      orderBy: { locale: 'asc' },
    });

    return { success: true, data: metadata };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return { success: false, error: 'Failed to fetch metadata' };
  }
}

export async function updateAppMetadata(
  locale: string,
  data: {
    name: string;
    shortName: string;
    description: string;
    keywords: string[];
    themeColor: string;
    bgColor: string;
  },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }

    await requireMinimumRole(100);

    const metadata = await prisma.appMetadata.update({
      where: { locale },
      data,
    });

    revalidatePath('/admin/configs');
    return { success: true, data: metadata };
  } catch (error) {
    console.error('Error updating metadata:', error);
    return { success: false, error: 'Failed to update metadata' };
  }
}
