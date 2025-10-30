import { PrismaClient, TagType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. CREATE PERMISSIONS
  // ============================================
  console.log('📋 Creating permissions...');

  const permissionsData = [
    // Posts
    {
      name: 'posts:create',
      resource: 'posts',
      action: 'create',
      description: 'Create new posts',
    },
    {
      name: 'posts:read',
      resource: 'posts',
      action: 'read',
      description: 'Read posts',
    },
    {
      name: 'posts:update',
      resource: 'posts',
      action: 'update',
      description: 'Update own posts',
    },
    {
      name: 'posts:delete',
      resource: 'posts',
      action: 'delete',
      description: 'Delete own posts',
    },
    {
      name: 'posts:publish',
      resource: 'posts',
      action: 'publish',
      description: 'Publish posts',
    },
    {
      name: 'posts:manage',
      resource: 'posts',
      action: 'manage',
      description: 'Manage all posts',
    },

    // Comments
    {
      name: 'comments:create',
      resource: 'comments',
      action: 'create',
      description: 'Create comments',
    },
    {
      name: 'comments:update',
      resource: 'comments',
      action: 'update',
      description: 'Update own comments',
    },
    {
      name: 'comments:delete',
      resource: 'comments',
      action: 'delete',
      description: 'Delete own comments',
    },
    {
      name: 'comments:manage',
      resource: 'comments',
      action: 'manage',
      description: 'Manage all comments',
    },

    // Media
    {
      name: 'media:upload',
      resource: 'media',
      action: 'upload',
      description: 'Upload media files',
    },
    {
      name: 'media:delete',
      resource: 'media',
      action: 'delete',
      description: 'Delete own media',
    },
    {
      name: 'media:manage',
      resource: 'media',
      action: 'manage',
      description: 'Manage all media',
    },

    // Users
    {
      name: 'users:read',
      resource: 'users',
      action: 'read',
      description: 'View user profiles',
    },
    {
      name: 'users:update',
      resource: 'users',
      action: 'update',
      description: 'Update own profile',
    },
    {
      name: 'users:manage',
      resource: 'users',
      action: 'manage',
      description: 'Manage all users',
    },

    // Categories & Tags
    {
      name: 'categories:manage',
      resource: 'categories',
      action: 'manage',
      description: 'Manage categories',
    },
    {
      name: 'tags:manage',
      resource: 'tags',
      action: 'manage',
      description: 'Manage tags',
    },

    // Settings
    {
      name: 'settings:read',
      resource: 'settings',
      action: 'read',
      description: 'View settings',
    },
    {
      name: 'settings:manage',
      resource: 'settings',
      action: 'manage',
      description: 'Manage system settings',
    },

    // Analytics
    {
      name: 'analytics:read',
      resource: 'analytics',
      action: 'read',
      description: 'View analytics',
    },

    // Admin - User Management
    {
      name: 'users:ban',
      resource: 'users',
      action: 'ban',
      description: 'Ban or unban users',
    },
    {
      name: 'users:suspend',
      resource: 'users',
      action: 'suspend',
      description: 'Suspend or unsuspend users',
    },
    {
      name: 'users:roles',
      resource: 'users',
      action: 'roles',
      description: 'Assign roles to users',
    },

    // Admin - System Management
    {
      name: 'roles:manage',
      resource: 'roles',
      action: 'manage',
      description: 'Manage roles and permissions',
    },
    {
      name: 'sessions:manage',
      resource: 'sessions',
      action: 'manage',
      description: 'Manage user sessions',
    },
    {
      name: 'logs:read',
      resource: 'logs',
      action: 'read',
      description: 'View system logs',
    },
    {
      name: 'logs:manage',
      resource: 'logs',
      action: 'manage',
      description: 'Manage and clear logs',
    },
    {
      name: 'contacts:read',
      resource: 'contacts',
      action: 'read',
      description: 'View contact messages',
    },
    {
      name: 'contacts:manage',
      resource: 'contacts',
      action: 'manage',
      description: 'Manage contact messages',
    },
    {
      name: 'snippets:manage',
      resource: 'snippets',
      action: 'manage',
      description: 'Manage all code snippets',
    },
  ];

  const permissions = await Promise.all(
    permissionsData.map(p =>
      prisma.permission.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      }),
    ),
  );

  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================
  // 2. CREATE ROLES
  // ============================================
  console.log('👥 Creating roles...');

  // USER Role (level 0)
  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Regular user - can comment and view content',
      level: 0,
      isSystem: true,
      color: '#6B7280',
    },
  });

  // AUTHOR Role (level 50)
  const authorRole = await prisma.role.upsert({
    where: { name: 'AUTHOR' },
    update: {},
    create: {
      name: 'AUTHOR',
      description: 'Content creator - can create and publish posts',
      level: 50,
      isSystem: true,
      color: '#3B82F6',
    },
  });

  // EDITOR Role (level 80)
  const editorRole = await prisma.role.upsert({
    where: { name: 'EDITOR' },
    update: {},
    create: {
      name: 'EDITOR',
      description: 'Editor - can manage all content',
      level: 80,
      isSystem: true,
      color: '#8B5CF6',
    },
  });

  // ADMIN Role (level 100)
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator - full system access',
      level: 100,
      isSystem: true,
      color: '#EF4444',
    },
  });

  console.log('✅ Created 4 roles');

  // ============================================
  // 3. ASSIGN PERMISSIONS TO ROLES
  // ============================================
  console.log('🔗 Assigning permissions to roles...');

  // USER permissions
  const userPermissions = permissions.filter(p =>
    [
      'comments:create',
      'comments:update',
      'comments:delete',
      'posts:read',
      'users:read',
      'users:update',
    ].includes(p.name),
  );

  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  // AUTHOR permissions (all USER permissions + post creation)
  const authorPermissions = permissions.filter(p =>
    [
      'comments:create',
      'comments:update',
      'comments:delete',
      'posts:read',
      'posts:create',
      'posts:update',
      'posts:delete',
      'posts:publish',
      'media:upload',
      'media:delete',
      'users:read',
      'users:update',
      'analytics:read',
    ].includes(p.name),
  );

  for (const permission of authorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: authorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: authorRole.id,
        permissionId: permission.id,
      },
    });
  }

  // EDITOR permissions (all AUTHOR permissions + manage others' content)
  const editorPermissions = permissions.filter(
    p =>
      !p.name.includes('settings:manage') && !p.name.includes('users:manage'),
  );

  for (const permission of editorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: editorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: editorRole.id,
        permissionId: permission.id,
      },
    });
  }

  // ADMIN permissions (ALL permissions)
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Assigned permissions to roles');

  // ============================================
  // 4. CREATE DEFAULT ADMIN USER
  // ============================================
  console.log('👤 Creating default admin user...');

  const hashedPassword = await bcrypt.hash('Admin@123456', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@anvel.com' },
    update: {},
    create: {
      email: 'admin@anvel.com',
      name: 'Admin',
      username: 'admin',
      password: hashedPassword,
      emailVerified: new Date(),
      roleId: adminRole.id,
      status: 'ACTIVE',
      bio: 'System Administrator',
    },
  });

  console.log('✅ Created admin user: admin@anvel.com / Admin@123456');

  // ============================================
  // 5. CREATE DEFAULT CATEGORIES
  // ============================================
  console.log('📁 Creating default categories...');

  const categories = [
    { name: 'Technology', slug: 'technology', icon: '💻', color: '#3B82F6' },
    { name: 'Design', slug: 'design', icon: '🎨', color: '#EC4899' },
    { name: 'Development', slug: 'development', icon: '⚙️', color: '#10B981' },
    { name: 'Tutorial', slug: 'tutorial', icon: '📚', color: '#F59E0B' },
    { name: 'News', slug: 'news', icon: '📰', color: '#6366F1' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log(`✅ Created ${categories.length} categories`);

  // ============================================
  // 6. CREATE DEFAULT TAGS
  // ============================================
  console.log('🏷️  Creating default tags...');

  const tags: {
    name: string;
    slug: string;
    type: TagType;
    color: string;
  }[] = [
    {
      name: 'JavaScript',
      slug: 'javascript',
      type: 'LANGUAGE',
      color: '#F7DF1E',
    },
    {
      name: 'TypeScript',
      slug: 'typescript',
      type: 'LANGUAGE',
      color: '#3178C6',
    },
    { name: 'React', slug: 'react', type: 'TECHNOLOGY', color: '#61DAFB' },
    { name: 'Next.js', slug: 'nextjs', type: 'TECHNOLOGY', color: '#000000' },
    { name: 'Node.js', slug: 'nodejs', type: 'TECHNOLOGY', color: '#339933' },
    { name: 'Python', slug: 'python', type: 'LANGUAGE', color: '#3776AB' },
    {
      name: 'Web Development',
      slug: 'web-development',
      type: 'TOPIC',
      color: '#FF6B6B',
    },
    { name: 'AI/ML', slug: 'ai-ml', type: 'TOPIC', color: '#9B59B6' },
  ];
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  console.log(`✅ Created ${tags.length} tags`);

  // ============================================
  // 7. CREATE SAMPLE LANGUAGES (for snippets)
  // ============================================
  console.log('💾 Creating programming languages...');

  const languages = [
    {
      name: 'JavaScript',
      slug: 'javascript',
      icon: '📜',
      color: '#F7DF1E',
      fileExt: ['js', 'mjs'],
      popularity: 100,
    },
    {
      name: 'TypeScript',
      slug: 'typescript',
      icon: '📘',
      color: '#3178C6',
      fileExt: ['ts'],
      popularity: 95,
    },
    {
      name: 'Python',
      slug: 'python',
      icon: '🐍',
      color: '#3776AB',
      fileExt: ['py'],
      popularity: 90,
    },
    {
      name: 'Java',
      slug: 'java',
      icon: '☕',
      color: '#007396',
      fileExt: ['java'],
      popularity: 85,
    },
    {
      name: 'Go',
      slug: 'go',
      icon: '🔵',
      color: '#00ADD8',
      fileExt: ['go'],
      popularity: 80,
    },
    {
      name: 'Rust',
      slug: 'rust',
      icon: '🦀',
      color: '#CE422B',
      fileExt: ['rs'],
      popularity: 75,
    },
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { slug: lang.slug },
      update: {},
      create: lang,
    });
  }

  console.log(`✅ Created ${languages.length} programming languages`);

  // ============================================
  // 8. CREATE SYSTEM CONFIGS
  // ============================================
  // console.log('⚙️  Creating system configs...');

  // await prisma.systemConfig.upsert({
  //   where: { key: 'site.name' },
  //   update: {},
  //   create: {
  //     key: 'site.name',
  //     value: 'Anvel',
  //     description: 'Website name',
  //     isPublic: true,
  //   },
  // });

  // await prisma.systemConfig.upsert({
  //   where: { key: 'site.description' },
  //   update: {},
  //   create: {
  //     key: 'site.description',
  //     value: 'Personal blog and portfolio platform',
  //     description: 'Website description',
  //     isPublic: true,
  //   },
  // });

  // await prisma.systemConfig.upsert({
  //   where: { key: 'translation.cache_limit' },
  //   update: {},
  //   create: {
  //     key: 'translation.cache_limit',
  //     value: 100,
  //     description: 'Maximum number of cached translations',
  //     isPublic: false,
  //   },
  // });

  // await prisma.systemConfig.upsert({
  //   where: { key: 'log.retention_days' },
  //   update: {},
  //   create: {
  //     key: 'log.retention_days',
  //     value: 30,
  //     description: 'Activity log retention period in days',
  //     isPublic: false,
  //   },
  // });

  // console.log('✅ Created system configs');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Default Credentials:');
  console.log('   Email: admin@anvel.com');
  console.log('   Password: Admin@123456');
  console.log('   Role: ADMIN\n');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
