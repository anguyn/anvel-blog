'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { UserMenu } from '../user-menu';
import { ThemeLocaleControls } from '@/components/common/theme-locale-control';
import { NavigationLinks } from './navigation-links';

interface NavigationItem {
  name: string;
  href: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
  pathname: string;
  locale: string;
}

export function MobileMenu({
  isOpen,
  onClose,
  navigation,
  pathname,
  locale,
}: MobileMenuProps) {
  const t = useTranslations('common');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 top-16 z-40 lg:hidden"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 h-full w-full overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-background)] shadow-xl"
          >
            <div className="container mx-auto space-y-6 p-6">
              {/* User Menu - Mobile variant */}
              <UserMenu
                locale={locale}
                variant="mobile"
                onItemClick={onClose}
              />

              <div className="border-t border-[var(--color-border)] pt-6">
                <NavigationLinks
                  navigation={navigation}
                  pathname={pathname}
                  onItemClick={onClose}
                  variant="mobile"
                />
              </div>

              <Button asChild className="w-full gap-2" size="lg">
                <Link href={`/${locale}/snippets/new`}>
                  <Plus className="h-5 w-5" />
                  {t('header.create')}
                </Link>
              </Button>

              <div className="flex items-center justify-center border-t border-[var(--color-border)] pt-6">
                <ThemeLocaleControls />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
