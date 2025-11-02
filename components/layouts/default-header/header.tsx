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
import { useUIStore } from '@/store/ui';

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const { isHeaderVisible, setIsHeaderVisible } = useUIStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();

  const isMobileMenuOpenRef = useRef(isMobileMenuOpen);
  const isUserMenuOpenRef = useRef(isUserMenuOpen);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useMotionValueEvent(scrollY, 'change', latest => {
    const currentScrollY = latest;
    const isAtTop = currentScrollY < 80;
    const scrollingDown = currentScrollY > lastScrollY;

    if (isAtTop || isUserMenuOpenRef.current || isMobileMenuOpenRef.current) {
      setIsHeaderVisible(true);
    } else {
      setIsHeaderVisible(scrollingDown ? false : true);
    }

    setLastScrollY(currentScrollY);

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      if (
        !isAtTop &&
        !isUserMenuOpenRef.current &&
        !isMobileMenuOpenRef.current
      ) {
        setIsHeaderVisible(false);
      }
    }, 2500);
  });

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    isMobileMenuOpenRef.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  useEffect(() => {
    isUserMenuOpenRef.current = isUserMenuOpen;
  }, [isUserMenuOpen]);

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

  const headerClassName =
    'fixed top-0 z-[100] w-full border-b border-[var(--color-border)] bg-[var(--color-background)] backdrop-blur supports-[backdrop-filter]:bg-[var(--color-background)]/60';

  const headerContent = (
    <div className="container mx-auto px-4">
      <div className="flex h-16 items-center justify-between">
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

          <NavigationLinks
            navigation={navigation}
            pathname={pathname}
            className="hidden lg:flex"
          />
        </div>

        <div className="flex items-center gap-3">
          {isMobile ? (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)]/50 px-3 py-1.5 text-[var(--color-muted-foreground)] transition-all duration-200 hover:scale-[1.02] hover:cursor-pointer hover:bg-[var(--color-secondary)] active:scale-[0.98] lg:flex"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">{t('header.search')}...</span>
              <kbd className="ml-2 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-1.5 py-0.5 text-xs">
                ⌘K
              </kbd>
            </button>
          ) : (
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
          )}

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
            <UserMenu
              locale={locale}
              isOpen={isUserMenuOpen}
              onOpenChange={setIsUserMenuOpen}
            />
          </div>

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
  );

  return (
    <>
      {isMobile ? (
        <header
          className={`${headerClassName} transition-transform duration-300 ease-out ${
            isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          {headerContent}
        </header>
      ) : (
        <motion.header
          initial={{ y: 0 }}
          animate={{ y: isHeaderVisible ? 0 : -100 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={headerClassName}
        >
          {headerContent}
        </motion.header>
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        locale={locale}
      />

      <MobileSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        locale={locale}
      />

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
