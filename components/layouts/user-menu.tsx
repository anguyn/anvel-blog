'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/libs/hooks/use-current-user';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, Heart, LogOut, Code2, Omega } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useUserStore } from '@/store/auth';
import { getThumbnailUrlFromAvatar } from '@/libs/utils';

interface UserMenuProps {
  locale: string;
  variant?: 'desktop' | 'mobile';
  onItemClick?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserMenu({
  locale,
  variant = 'desktop',
  onItemClick,
  isOpen,
  onOpenChange,
}: UserMenuProps) {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  const clearAuth = useUserStore(state => state.clearAuth);

  if (isLoading) {
    return (
      <div className="bg-secondary h-10 w-10 animate-pulse rounded-full" />
    );
  }

  const getLoginUrl = () => {
    const isHomePage =
      pathname === `/` ||
      pathname === `/${locale}` ||
      pathname === `/${locale}/`;

    if (isHomePage) {
      return `/${locale}/login`;
    }

    return `/${locale}/login?callbackUrl=${encodeURIComponent(pathname)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex w-full items-center gap-2 md:w-auto">
        <Button variant="outline" asChild>
          <Link href={getLoginUrl()}>{t('signIn')}</Link>
        </Button>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      clearAuth();
      await signOut({ redirect: false });
      toast.success(t('signedOutSuccess'));
      router.refresh();
      onItemClick?.();
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

  const isAdmin = user?.roleName != 'USER';

  if (variant === 'mobile') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4">
          <Avatar
            className="bg-muted h-12 w-12 overflow-hidden rounded-full"
            aria-label={user?.name ?? t('avatarAlt')}
          >
            {user?.image ? (
              <AvatarImage
                key={user.image}
                src={getThumbnailUrlFromAvatar(user.image)}
                alt={user.name ?? 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback className="flex items-center justify-center">
                {user?.name ? (
                  <span className="text-base font-medium">{initials}</span>
                ) : (
                  <User className="h-6 w-6" />
                )}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{user?.name}</p>
            <p className="text-muted-foreground text-xs leading-none">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <Link
            href={`/${locale}/users/${user?.username}`}
            className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
            onClick={onItemClick}
          >
            <User className="h-4 w-4" />
            {t('profile')}
          </Link>

          <div className="text-muted-foreground flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm">
            <Code2 className="h-4 w-4" />
            {t('mySnippets')}
          </div>

          <Link
            href={`/${locale}/favorites`}
            className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
            onClick={onItemClick}
          >
            <Heart className="h-4 w-4" />
            {t('favorites')}
          </Link>

          <Link
            href={`/${locale}/settings`}
            className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
            onClick={onItemClick}
          >
            <Settings className="h-4 w-4" />
            {t('settings')}
          </Link>

          {isAdmin && (
            <>
              <div className="my-2 border-t border-[var(--color-border)]" />
              <Link
                href={`/${locale}/admin`}
                className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
                onClick={onItemClick}
              >
                <Omega className="h-4 w-4" />
                {t('dashboard')}
              </Link>
            </>
          )}

          <div className="my-2 border-t border-[var(--color-border)]" />

          <button
            onClick={handleSignOut}
            className="hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t('signOut')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" asChild className="!p-0 hover:cursor-pointer">
          <Avatar
            className="bg-muted h-9 w-9 overflow-hidden rounded-full"
            aria-label={user?.name ?? t('avatarAlt')}
          >
            {user?.image ? (
              <AvatarImage
                key={user.image}
                src={getThumbnailUrlFromAvatar(user.image)}
                alt={user.name ?? 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback className="flex items-center justify-center">
                {user?.name ? (
                  <span className="text-sm font-medium">{initials}</span>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{user?.name}</p>
            <p className="text-muted-foreground text-xs leading-none">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/${locale}/users/${user?.username}`}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            {t('profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <div className="hover:cursor-not-allowed">
            <Code2 className="mr-2 h-4 w-4" />
            {t('mySnippets')}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/favorites`} className="cursor-pointer">
            <Heart className="mr-2 h-4 w-4" />
            {t('favorites')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/settings`} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            {t('settings')}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/admin`} className="cursor-pointer">
                <Omega className="mr-2 h-4 w-4" />
                {t('dashboard')}
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
