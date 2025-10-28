'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Search, Plus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '../user-menu';
import { useState, useEffect, useRef } from 'react';
import { ThemeLocaleControls } from '@/components/common/theme-locale-control';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { SearchModal } from './search-modal';
import { MobileSearch } from './mobile-search';
import { MobileMenu } from './mobile-menu';
import { NavigationLinks } from './navigation-links';

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', latest => {
    const currentScrollY = latest;
    const isAtTop = currentScrollY < 80;
    const scrollingDown = currentScrollY > lastScrollY;

    if (isAtTop) {
      setIsVisible(true);
    } else {
      setIsVisible(scrollingDown ? false : true);
    }

    setLastScrollY(currentScrollY);

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      if (!isAtTop) {
        setIsVisible(false);
      }
    }, 2500);
  });

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  const navigation = [
    { name: t('header.explore'), href: `/${locale}` },
    { name: t('header.blog'), href: `/${locale}/blog` },
    { name: t('header.snippets'), href: `/${locale}/snippets` },
    { name: t('header.tags'), href: `/${locale}/tags` },
    { name: t('header.about'), href: `/${locale}/about` },
  ];

  return (
    <>
      {/* Main Header */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-background)]/60"
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link
                href={`/${locale}`}
                className="flex items-center gap-2 font-semibold"
              >
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  priority
                />
                <span className="text-xl">
                  {process.env.NEXT_PUBLIC_DEFAULT_TITLE}
                </span>
              </Link>

              {/* Desktop Navigation */}
              <NavigationLinks
                navigation={navigation}
                pathname={pathname}
                className="hidden lg:flex"
              />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Search Button - Desktop */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSearchOpen(true)}
                className="hidden items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)]/50 px-3 py-1.5 text-[var(--color-muted-foreground)] transition-colors hover:cursor-pointer hover:bg-[var(--color-secondary)] lg:flex"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">{t('header.search')}...</span>
                <kbd className="ml-2 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-1.5 py-0.5 text-xs">
                  ⌘K
                </kbd>
              </motion.button>

              {/* Search Button - Mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="lg:hidden"
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button asChild className="hidden gap-2 lg:flex">
                <Link href={`/${locale}/snippets/new`}>
                  <Plus className="h-4 w-4" />
                  {t('header.create')}
                </Link>
              </Button>

              <ThemeLocaleControls className="hidden lg:flex" />

              <div className="hidden lg:block">
                <UserMenu locale={locale} />
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Desktop Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        locale={locale}
      />

      {/* Mobile Search Fullscreen */}
      <MobileSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        locale={locale}
      />

      {/* Mobile Menu Overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigation={navigation}
        pathname={pathname}
        locale={locale}
      />
    </>
  );
}
