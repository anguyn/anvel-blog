import { PrismaClient, ConfigType } from '@prisma/client';

const prisma = new PrismaClient();

const defaultConfigs = [
  // App Configuration
  {
    key: 'app.name',
    value: 'Anvel',
    type: ConfigType.STRING,
    category: 'app',
    description: 'Application name',
    isPublic: true,
  },
  {
    key: 'app.title',
    value: 'Anvel - Share & Discover Code Snippets',
    type: ConfigType.STRING,
    category: 'app',
    description: 'Application title for SEO',
    isPublic: true,
  },
  {
    key: 'app.url',
    value: 'http://localhost:3000',
    type: ConfigType.STRING,
    category: 'app',
    description: 'Main application URL',
    isPublic: true,
  },

  // Rate Limiting
  {
    key: 'rate_limit.verification_resend',
    value: '5m',
    type: ConfigType.DURATION,
    category: 'rate_limit',
    description: 'Cooldown between verification email resends',
    isPublic: false,
  },
  {
    key: 'rate_limit.password_reset_resend',
    value: '5m',
    type: ConfigType.DURATION,
    category: 'rate_limit',
    description: 'Cooldown between password reset email resends',
    isPublic: false,
  },
  {
    key: 'rate_limit.max_verification_per_hour',
    value: '3',
    type: ConfigType.NUMBER,
    category: 'rate_limit',
    description: 'Maximum verification emails per hour per user',
    isPublic: false,
  },
  {
    key: 'rate_limit.max_password_reset_per_hour',
    value: '3',
    type: ConfigType.NUMBER,
    category: 'rate_limit',
    description: 'Maximum password reset emails per hour per user',
    isPublic: false,
  },
  {
    key: 'rate_limit.max_emails_per_minute',
    value: '10',
    type: ConfigType.NUMBER,
    category: 'rate_limit',
    description: 'Maximum emails per minute per user',
    isPublic: false,
  },

  // Token Expiry
  {
    key: 'token.verification_expiry',
    value: '24h',
    type: ConfigType.DURATION,
    category: 'security',
    description: 'Verification token expiry time',
    isPublic: false,
  },
  {
    key: 'token.password_reset_expiry',
    value: '1h',
    type: ConfigType.DURATION,
    category: 'security',
    description: 'Password reset token expiry time',
    isPublic: false,
  },
  {
    key: 'token.resend_cooldown',
    value: '180',
    type: ConfigType.NUMBER,
    category: 'security',
    description: 'Cooldown in seconds before resending',
    isPublic: true,
  },

  // Cleanup Jobs
  {
    key: 'cleanup.unverified_users_enabled',
    value: 'true',
    type: ConfigType.BOOLEAN,
    category: 'maintenance',
    description: 'Enable cleanup of unverified users',
    isPublic: false,
  },
  {
    key: 'cleanup.unverified_user_retention',
    value: '24h',
    type: ConfigType.DURATION,
    category: 'maintenance',
    description: 'How long to keep unverified users',
    isPublic: false,
  },
  {
    key: 'cleanup.expired_tokens_enabled',
    value: 'true',
    type: ConfigType.BOOLEAN,
    category: 'maintenance',
    description: 'Enable cleanup of expired tokens',
    isPublic: false,
  },

  // Email Configuration
  {
    key: 'email.provider',
    value: 'resend',
    type: ConfigType.STRING,
    category: 'email',
    description: 'Email provider (resend, sendpulse)',
    isPublic: false,
  },
  {
    key: 'email.from_name',
    value: 'Anvel',
    type: ConfigType.STRING,
    category: 'email',
    description: 'Email sender name',
    isPublic: false,
  },

  // Feature Flags
  {
    key: 'feature.social_login_enabled',
    value: 'true',
    type: ConfigType.BOOLEAN,
    category: 'features',
    description: 'Enable social login (Google, GitHub, Facebook)',
    isPublic: true,
  },
  {
    key: 'feature.email_verification_required',
    value: 'true',
    type: ConfigType.BOOLEAN,
    category: 'features',
    description: 'Require email verification for new users',
    isPublic: false,
  },

  // PWA Configuration
  {
    key: 'pwa.theme_color',
    value: '#000000',
    type: ConfigType.STRING,
    category: 'app',
    description: 'PWA theme color',
    isPublic: true,
  },
  {
    key: 'pwa.background_color',
    value: '#ffffff',
    type: ConfigType.STRING,
    category: 'app',
    description: 'PWA background color',
    isPublic: true,
  },
];

const defaultFeatureFlags = [
  {
    name: 'new_snippet_editor',
    description: 'New code editor with AI suggestions',
    enabled: false,
    percentage: 0,
  },
  {
    name: 'social_sharing',
    description: 'Share snippets on social media',
    enabled: true,
    percentage: 100,
  },
  {
    name: 'collaborative_editing',
    description: 'Real-time collaborative editing',
    enabled: false,
    percentage: 10, // 10% rollout
  },
];

const defaultAppMetadata = [
  {
    locale: 'en',
    name: 'Anvel',
    shortName: 'Anvel',
    description: 'Platform for developers to share and discover code snippets',
    keywords: ['code snippets', 'programming', 'developer tools'],
    themeColor: '#000000',
    bgColor: '#ffffff',
    seo: {
      author: 'An Nguyen',
      creator: 'Nguyen Van An',
    },
  },
  {
    locale: 'vi',
    name: 'Anvel',
    shortName: 'Anvel',
    description:
      'Nền tảng chia sẻ và khám phá code snippets cho lập trình viên',
    keywords: ['code snippets', 'lập trình', 'công cụ phát triển'],
    themeColor: '#000000',
    bgColor: '#ffffff',
    seo: {
      author: 'An Nguyen',
      creator: 'Nguyen Van An',
    },
  },
];

export async function seedConfigs() {
  console.log('🌱 Seeding system configurations...');

  // Seed configs
  for (const config of defaultConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  // Seed feature flags
  for (const flag of defaultFeatureFlags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: {},
      create: flag,
    });
  }

  // Seed app metadata
  for (const meta of defaultAppMetadata) {
    await prisma.appMetadata.upsert({
      where: { locale: meta.locale },
      update: {},
      create: meta,
    });
  }

  console.log('✅ Seeding completed!');
}

seedConfigs()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
