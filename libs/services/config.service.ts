import { PrismaClient, ConfigType } from '@prisma/client';

const prisma = new PrismaClient();

const configCache = new Map<string, { value: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

export class ConfigService {
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

  static async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    const cached = configCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.value as T;
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Config not found: ${key}`);
    }

    const parsedValue = this.parseValue(config.value, config.type);

    configCache.set(key, {
      value: parsedValue,
      expiry: Date.now() + CACHE_TTL,
    });

    return parsedValue as T;
  }

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

    await prisma.systemConfig.update({
      where: { key },
      data: { value: newValue },
    });

    await prisma.configHistory.create({
      data: {
        configKey: key,
        oldValue,
        newValue,
        changedBy,
        reason,
      },
    });

    configCache.delete(key);
  }

  static async isFeatureEnabled(featureName: string): Promise<boolean> {
    const feature = await prisma.featureFlag.findUnique({
      where: { name: featureName },
    });

    if (!feature) return false;
    if (!feature.enabled) return false;

    if (feature.percentage < 100) {
      return Math.random() * 100 < feature.percentage;
    }

    return true;
  }

  static async getAppMetadata(locale: string = 'en') {
    return prisma.appMetadata.findUnique({
      where: { locale },
    });
  }

  static clearCache(): void {
    configCache.clear();
  }

  static async reload(key: string): Promise<void> {
    configCache.delete(key);
    await this.get(key);
  }
}

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
