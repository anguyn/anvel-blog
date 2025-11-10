'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Lock, Bell, Palette, Settings } from 'lucide-react';
import { cn } from '@/libs/utils';

interface SettingsLayoutProps {
  children: ReactNode;
  locale: string;
  translations: {
    settings: string;
    profile: string;
    account: string;
    security: string;
    notifications: string;
    appearance: string;
  };
}

const menuItems = [
  {
    key: 'profile',
    icon: User,
    href: '/settings',
  },
  {
    key: 'account',
    icon: Settings,
    href: '/settings/account',
  },
  {
    key: 'security',
    icon: Lock,
    href: '/settings/security',
  },
  {
    key: 'notifications',
    icon: Bell,
    href: '/settings/notifications',
  },
  {
    key: 'appearance',
    icon: Palette,
    href: '/settings/appearance',
  },
];

export function SettingsLayout({
  children,
  locale,
  translations,
}: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="mb-8 text-3xl font-bold">{translations.settings}</h1>
      </motion.div>

      <div className="flex flex-col gap-8 md:flex-row">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-full flex-shrink-0 md:w-64"
        >
          <nav className="space-y-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const fullPath = `/${locale}${item.href}`;
              const isActive = pathname === fullPath;

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={fullPath}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'dark:text-muted bg-[var(--color-primary)] text-white shadow-md'
                        : 'text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {translations[item.key as keyof typeof translations]}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </motion.aside>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex-1"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
