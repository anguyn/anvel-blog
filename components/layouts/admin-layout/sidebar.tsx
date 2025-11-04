'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Bus,
  Users,
  MapPin,
  Route,
  Calendar,
  Ticket,
  BarChart3,
  Map,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Car,
  Sparkles,
  Shield,
  Bell,
  LucideIcon,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/libs/utils';
import { Badge } from '@/components/common/badge';
import { useUserStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { useMediaQuery } from '@/libs/hooks/use-media-query';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SystemConfig } from './client';
import { useLocale } from '@/libs/hooks/use-locale';
import { useTranslations } from 'next-intl';

interface MenuItemChild {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  permission?: string | null;
  gradient: string;
  badge?: string;
  children?: MenuItemChild[];
}

interface MenuItemProps {
  item: MenuItem | MenuItemChild;
  isActive: boolean;
  isSidebarOpen: boolean;
  level?: number;
  onItemClick?: () => void;
}

function MenuItem({
  item,
  isActive,
  isSidebarOpen,
  level = 0,
  onItemClick,
}: MenuItemProps) {
  const { locale } = useLocale();

  const hasChildren =
    'children' in item && item.children && item.children.length > 0;
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isChildActive =
    hasChildren &&
    item.children!.some(
      (child: MenuItemChild) =>
        pathname === child.href ||
        (child.href !== '/admin' && pathname.startsWith(child.href)),
    );

  const shouldShowAsActive = isActive || isChildActive;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasChildren && !item.href) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    } else if (item.href && onItemClick) {
      onItemClick();
    }
  };

  const menuContent = (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group relative flex cursor-pointer items-center space-x-3 rounded-xl px-3 py-2.5 transition-all duration-150',
        'hover:bg-gray-100/50 dark:hover:bg-gray-800/40',
        shouldShowAsActive &&
          'border border-gray-200/20 bg-gray-50/60 shadow-sm dark:border-gray-700/20 dark:bg-gray-800/60',
        level > 0 && 'ml-4 py-2',
      )}
      onClick={handleClick}
    >
      {/* Active indicator */}
      {shouldShowAsActive && level === 0 && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-purple-600"
          transition={{
            type: 'spring',
            bounce: 0.1,
            duration: 0.4,
          }}
        />
      )}

      {/* Icon with gradient background */}
      <div
        className={cn(
          'relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150',
          shouldShowAsActive
            ? `bg-gradient-to-br ${'gradient' in item ? item.gradient : 'from-gray-400 to-gray-600'} shadow-md`
            : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700',
          level > 0 && 'h-6 w-6',
        )}
      >
        <item.icon
          className={cn(
            'transition-colors',
            shouldShowAsActive
              ? 'text-white'
              : 'text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white',
            level > 0 ? 'h-3.5 w-3.5' : 'h-4 w-4',
          )}
        />
      </div>

      {/* Label and badge */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex min-w-0 flex-1 items-center justify-between"
          >
            <span
              className={cn(
                'truncate font-medium transition-colors',
                shouldShowAsActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white',
                level > 0 ? 'text-xs' : 'text-sm',
              )}
            >
              {item.title}
            </span>

            <div className="flex items-center space-x-2">
              {item.badge && (
                <Badge
                  variant={
                    item.badge === 'New' || item.badge === 'Live'
                      ? 'default'
                      : 'secondary'
                  }
                  className={cn(
                    'px-1.5 py-0 text-xs font-medium',
                    item.badge === 'Live' &&
                      'animate-pulse bg-gradient-to-r from-red-500 to-pink-500 text-white',
                    item.badge === 'New' &&
                      'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
                  )}
                >
                  {item.badge}
                </Badge>
              )}

              {hasChildren && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (!isSidebarOpen && hasChildren) {
    // Tooltip for collapsed sidebar with children
    return (
      <div>
        <Tooltip>
          <TooltipTrigger asChild>{menuContent}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-gray-900 p-2 text-xs text-white"
          >
            <div className="mb-1 font-medium">{item.title}</div>
            {'children' in item &&
              item.children?.map((child: MenuItemChild, index: number) => (
                <div key={index} className="text-gray-300">
                  • {child.title}
                </div>
              ))}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (!isSidebarOpen && item.href) {
    // Tooltip for collapsed sidebar with single items
    return (
      <Link
        href={locale ? `/${locale}${item.href}` : item.href}
        onClick={onItemClick}
      >
        <Tooltip>
          <TooltipTrigger asChild>{menuContent}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-gray-900 p-2 text-xs text-white"
          >
            {item.title}
          </TooltipContent>
        </Tooltip>
      </Link>
    );
  }

  return (
    <div>
      {item.href ? (
        <Link href={locale ? `/${locale}${item.href}` : item.href}>
          {menuContent}
        </Link>
      ) : (
        menuContent
      )}

      {/* Children items */}
      <AnimatePresence>
        {hasChildren && isExpanded && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1 }}
            className="ml-2 space-y-1 overflow-hidden"
          >
            {'children' in item &&
              item.children?.map((child: MenuItemChild, index: number) => (
                <MenuItem
                  key={child.href || index}
                  item={child}
                  isActive={
                    pathname === child.href ||
                    (child.href !== '/admin' && pathname.startsWith(child.href))
                  }
                  isSidebarOpen={isSidebarOpen}
                  level={level + 1}
                  onItemClick={onItemClick}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export interface DashboardSidebarProps {
  systemConfig: SystemConfig | null;
}

export function DashboardSidebar({ systemConfig }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useUserStore();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        title: 'Dashboard',
        href: '/admin',
        icon: Home,
        permission: null,
        gradient: 'from-blue-500 to-purple-600',
      },
      {
        title: 'Người dùng',
        // href: '/admin/users',
        icon: Users,
        gradient: 'from-green-500 to-teal-600',
        badge: '2.8k',
        children: [
          {
            title: 'Phân quyền',
            href: '/admin/user/permission-list',
            icon: Car,
          },
          {
            title: 'Vai trò',
            href: '/admin/user/roles-list',
            icon: Route,
            badge: '42',
          },
          {
            title: 'Người dùng',
            href: '/admin/users',
            icon: MapPin,
            badge: '287',
          },
        ],
      },
      {
        title: 'Blog Management',
        icon: Newspaper,
        gradient: 'from-orange-500 to-red-600',
        children: [
          {
            title: 'Blog Types',
            href: '/admin/bus-types',
            icon: Car,
          },
          {
            title: 'Routes',
            href: '/admin/routes',
            icon: Route,
            badge: '42',
          },
          {
            title: 'Blog Stops',
            href: '/admin/bus-stops',
            icon: MapPin,
            badge: '287',
          },
        ],
      },
      {
        title: 'Operations',
        icon: Calendar,
        gradient: 'from-purple-500 to-pink-600',
        children: [
          {
            title: 'Trips',
            href: '/admin/trips',
            icon: Calendar,
          },
          {
            title: 'Bookings',
            href: '/admin/bookings',
            icon: Ticket,
            badge: 'New',
          },
          {
            title: 'Tickets',
            href: '/admin/tickets',
            icon: Shield,
          },
        ],
      },
      {
        title: 'Live Tracking',
        href: '/admin/live-tracking',
        icon: Map,
        gradient: 'from-rose-500 to-pink-600',
        badge: 'Live',
      },
      {
        title: 'Categories',
        href: '/admin/categories',
        icon: BarChart3,
        gradient: 'from-amber-500 to-orange-600',
      },
      {
        title: 'Posts',
        href: '/admin/posts',
        icon: FileText,
        gradient: 'from-teal-500 to-cyan-600',
      },
      {
        title: 'Settings',
        href: '/admin/configs',
        icon: Settings,
        gradient: 'from-gray-500 to-slate-600',
      },
    ],
    [locale],
  );

  const filteredMenuItems: MenuItem[] = menuItems.filter(
    (item: MenuItem) => !item.permission,
  );

  const handleMenuItemClick = () => {
    if (!isDesktop) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile/Tablet overlay */}
      <AnimatePresence>
        {isSidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? 280 : isDesktop ? 80 : 0,
          x: !isDesktop && !isSidebarOpen ? -280 : 0,
        }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
        className={cn(
          'fixed top-0 left-0 z-45 flex h-screen flex-col',
          'dark:bg-background/95 bg-white/95 backdrop-blur-xl',
          'shadow-xl shadow-black/5',
        )}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-pink-500/3 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />

        {/* Header */}
        <div className="relative flex h-16 items-center justify-between border-b px-4">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-3"
              >
                <div className="relative">
                  {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg"> */}
                  {systemConfig?.logo && (
                    <Image
                      height={30}
                      width={30}
                      src={systemConfig?.logo || '/images/text-logo.png'}
                      alt="logo"
                      className="h-fit object-contain"
                    />
                  )}
                  {/* </div> */}
                  <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-green-500">
                    <Sparkles className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div>
                  <h1
                    className={cn(
                      'bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-lg font-bold text-transparent dark:from-white dark:to-gray-300',
                      'truncate',
                    )}
                    title={systemConfig?.appName || 'Bus System'}
                  >
                    {systemConfig?.appName || 'Bus System'}
                  </h1>

                  <p
                    className={cn(
                      'text-xs font-medium text-gray-500 dark:text-gray-400',
                      'truncate',
                    )}
                  >
                    {t('title')}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative mx-auto"
              >
                {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg"> */}
                {systemConfig?.logo && (
                  <Image
                    height={30}
                    width={30}
                    src={systemConfig?.logo || '/images/text-logo.png'}
                    alt="logo"
                    className="h-fit object-contain"
                  />
                )}
                {/* </div> */}
                <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-green-500">
                  <Sparkles className="h-2 w-2 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle button - only show on desktop when sidebar is open */}
          {isDesktop && (
            <motion.button
              whileHover={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="-mr-5 rounded-lg p-1.5 transition-colors hover:cursor-pointer hover:bg-gray-100/30 dark:hover:bg-gray-800/70"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              )}
            </motion.button>
          )}
        </div>

        {/* Main content area with fixed height */}
        <div className="flex min-h-0 flex-1 flex-col border-r">
          {/* User info */}
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative flex-shrink-0 border-b border-gray-200/50 p-4 dark:border-gray-700/50"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-500">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400 dark:border-gray-900"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="px-1.5 py-0 text-xs">
                      {user?.roleName}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation - Scrollable */}
          <nav className="relative flex-1 space-y-1 overflow-y-auto p-3">
            {filteredMenuItems.map((item, index) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' &&
                  typeof item.href == 'string' &&
                  pathname.startsWith(item.href));

              return (
                <motion.div
                  key={item.href || item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <MenuItem
                    item={item}
                    isActive={isActive}
                    isSidebarOpen={isSidebarOpen}
                    onItemClick={handleMenuItemClick}
                  />
                </motion.div>
              );
            })}
          </nav>

          {/* Bottom section - Fixed at bottom */}
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative flex-shrink-0 border-t border-gray-200/50 p-3 dark:border-gray-700/50"
            >
              <div className="rounded-xl border border-blue-200/30 bg-gradient-to-br from-blue-50/80 to-purple-50/80 p-3 dark:border-blue-800/30 dark:from-blue-950/50 dark:to-purple-950/50">
                <div className="mb-2 flex items-center space-x-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Upgrade to Pro
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get advanced features
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg"
                >
                  Upgrade Now
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
