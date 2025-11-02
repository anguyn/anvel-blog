'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 top-16 z-[100] lg:hidden">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute right-0 h-full w-full overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-background)] shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="container mx-auto space-y-6 p-6">
          <UserMenu locale={locale} variant="mobile" onItemClick={onClose} />

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
      </div>
    </div>
  );
}
