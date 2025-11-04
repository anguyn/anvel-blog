import { Bell, Moon, Sun, User, LogOut, Menu, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/common/badge';
import { useUserStore } from '@/store/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeLocaleControls } from '@/components/common/theme-locale-control';
import { useUIStore } from '@/store/ui';
import { useMediaQuery } from '@/libs/hooks/use-media-query';
import { useTranslations } from 'next-intl';
import { titleCase } from '@/libs/utils';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/libs/hooks/use-locale';

export interface DashboardHeaderProps {}

const DashboardHeader = ({}: DashboardHeaderProps) => {
  const router = useRouter();
  const { locale } = useLocale();
  const { user } = useUserStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const t = useTranslations('dashboard');
  const clearAuth = useUserStore(state => state.clearAuth);

  const handleSignOut = async () => {
    try {
      clearAuth();
      await signOut({ redirect: false });
      toast.success(t('signedOutSuccess'));
      router.refresh();
    } catch (error) {
      toast.error(t('signedOutError'));
    }
  };

  const initials =
    user?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <motion.header
      initial={false}
      className="bg-card/95 sticky top-0 z-40 h-16 border-b backdrop-blur-xl"
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="hover:bg-accent flex h-9 w-9 p-0 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              {!isSidebarOpen || !isDesktop ? (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="hidden sm:block"
                >
                  <h1 className="from-foreground to-muted-foreground bg-gradient-to-r bg-clip-text text-lg sm:text-xl">
                    {titleCase(t('blogManagement'))}
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {t('welcomeBack', {
                      name: user?.name || user?.username || user?.email || '',
                    })}
                  </p>
                </motion.div>
              ) : (
                <motion.h1
                  key="expanded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="from-foreground to-muted-foreground hidden bg-gradient-to-r bg-clip-text text-lg sm:block sm:text-xl"
                >
                  {t('welcomeBack', {
                    name: user?.name || user?.username || user?.email || '',
                  })}
                </motion.h1>
              )}
            </AnimatePresence>

            {/* Mobile title - always shown on small screens */}
            <div className="block sm:hidden">
              <h1 className="from-foreground to-muted-foreground bg-gradient-to-r bg-clip-text text-lg font-semibold">
                BusAdmin
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme controls - hidden on very small screens */}
          <div className="hidden sm:block">
            <ThemeLocaleControls />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-accent relative h-9 w-9 p-0"
          >
            <Bell className="h-4 w-4" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-accent h-9 w-9 rounded-full p-0 hover:cursor-pointer"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user?.image || ''}
                    alt={user?.name ?? 'User'}
                  />
                  <AvatarFallback className="from-primary to-primary/80 text-primary-foreground bg-gradient-to-br">
                    {user?.name ? (
                      <span className="text-sm font-medium">{initials}</span>
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-[hsl(222.2_84%_4.9%)]"
            >
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.name || user?.username || ''}
                  </p>
                  <p className="text-muted-foreground text-xs">{user?.email}</p>
                  <Badge variant="outline" className="w-fit text-xs">
                    {user?.roleName}
                  </Badge>
                </div>
              </div>

              <DropdownMenuSeparator />

              <div className="block p-2 sm:hidden">
                <ThemeLocaleControls />
              </div>

              <div className="block sm:hidden">
                <DropdownMenuSeparator />
              </div>

              <DropdownMenuItem>
                <Link href={`/${locale}/settings`} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};

export { DashboardHeader };
