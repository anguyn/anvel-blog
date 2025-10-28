import { PrismaClient, ConfigType } from '@prisma/client';

const prisma = new PrismaClient();

const configCache = new Map<string, { value: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

export class ConfigService {
  // Parse duration string (5m, 1h, 24h) to milliseconds
  private static parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid duration format: ${duration}`);

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return num * units[unit];
  }

  // Parse value based on type
  private static parseValue(value: string, type: ConfigType): any {
    switch (type) {
      case ConfigType.STRING:
        return value;
      case ConfigType.NUMBER:
        return parseFloat(value);
      case ConfigType.BOOLEAN:
        return value === 'true' || value === '1';
      case ConfigType.JSON:
        return JSON.parse(value);
      case ConfigType.DURATION:
        return this.parseDuration(value);
      default:
        return value;
    }
  }

  // Get config with caching
  static async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    // Check cache
    const cached = configCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.value as T;
    }

    // Query DB
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Config not found: ${key}`);
    }

    const parsedValue = this.parseValue(config.value, config.type);

    // Cache result
    configCache.set(key, {
      value: parsedValue,
      expiry: Date.now() + CACHE_TTL,
    });

    return parsedValue as T;
  }

  // Get multiple configs at once
  static async getMany(keys: string[]): Promise<Record<string, any>> {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });

    return configs.reduce(
      (acc, config) => {
        acc[config.key] = this.parseValue(config.value, config.type);
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  // Get all configs by category
  static async getByCategory(category: string): Promise<Record<string, any>> {
    const configs = await prisma.systemConfig.findMany({
      where: { category },
    });

    return configs.reduce(
      (acc, config) => {
        acc[config.key] = this.parseValue(config.value, config.type);
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  // Get public configs (for client-side)
  static async getPublicConfigs(): Promise<Record<string, any>> {
    const configs = await prisma.systemConfig.findMany({
      where: { isPublic: true },
    });

    return configs.reduce(
      (acc, config) => {
        acc[config.key] = this.parseValue(config.value, config.type);
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  // Set config value with history
  static async set(
    key: string,
    value: any,
    changedBy?: string,
    reason?: string,
  ): Promise<void> {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      throw new Error(`Config not found: ${key}`);
    }

    const oldValue = config.value;
    const newValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    // Update config
    await prisma.systemConfig.update({
      where: { key },
      data: { value: newValue },
    });

    // Save history
    await prisma.configHistory.create({
      data: {
        configKey: key,
        oldValue,
        newValue,
        changedBy,
        reason,
      },
    });

    // Clear cache
    configCache.delete(key);
  }

  // Check if feature is enabled
  static async isFeatureEnabled(featureName: string): Promise<boolean> {
    const feature = await prisma.featureFlag.findUnique({
      where: { name: featureName },
    });

    if (!feature) return false;
    if (!feature.enabled) return false;

    // Check percentage rollout
    if (feature.percentage < 100) {
      // Simple random rollout (trong production nên dùng userId hash)
      return Math.random() * 100 < feature.percentage;
    }

    return true;
  }

  // Get app metadata by locale
  static async getAppMetadata(locale: string = 'en') {
    return prisma.appMetadata.findUnique({
      where: { locale },
    });
  }

  // Clear all cache
  static clearCache(): void {
    configCache.clear();
  }

  // Reload specific config
  static async reload(key: string): Promise<void> {
    configCache.delete(key);
    await this.get(key);
  }
}

// Helper functions for common configs
export const getAppName = () => ConfigService.get<string>('app.name');
export const getAppUrl = () => ConfigService.get<string>('app.url');
export const getVerificationExpiry = () =>
  ConfigService.get<number>('token.verification_expiry');
export const getPasswordResetExpiry = () =>
  ConfigService.get<number>('token.password_reset_expiry');
export const getRateLimitMaxPerHour = () =>
  ConfigService.get<number>('rate_limit.max_verification_per_hour');
export const isCleanupEnabled = () =>
  ConfigService.get<boolean>('cleanup.unverified_users_enabled');
