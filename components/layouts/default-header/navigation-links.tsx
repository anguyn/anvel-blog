import Link from 'next/link';
import { cn } from '@/libs/utils';

interface NavigationItem {
  name: string;
  href: string;
}

interface NavigationLinksProps {
  navigation: NavigationItem[];
  pathname: string;
  className?: string;
  onItemClick?: () => void;
  variant?: 'desktop' | 'mobile';
}

const normalize = (path: string) => {
  const p = path.replace(/^\/(en|vi)(?=\/|$)/, '');
  return p === '' ? '/' : p;
};

export function NavigationLinks({
  navigation,
  pathname,
  className,
  onItemClick,
  variant = 'desktop',
}: NavigationLinksProps) {
  const normalizedPath = normalize(pathname);

  if (variant === 'mobile') {
    return (
      <nav className={cn('flex flex-col space-y-1', className)}>
        {navigation.map(item => {
          const normalizedHref = normalize(item.href);
          const isActive =
            normalizedPath === normalizedHref ||
            (normalizedHref !== '/' &&
              normalizedPath.startsWith(`${normalizedHref}/`));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'rounded-lg px-4 py-3 text-base font-medium transition-colors',
                isActive
                  ? 'bg-[var(--color-secondary)] text-[var(--color-foreground)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]/50 hover:text-[var(--color-foreground)]',
              )}
              onClick={onItemClick}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn('items-center gap-6', className)}>
      {navigation.map(item => {
        const normalizedHref = normalize(item.href);
        const isActive =
          normalizedPath === normalizedHref ||
          (normalizedHref !== '/' &&
            normalizedPath.startsWith(`${normalizedHref}/`));

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'text-sm font-medium transition-colors hover:text-[var(--color-primary)]',
              isActive
                ? 'font-semibold text-[var(--color-foreground)]'
                : 'text-[var(--color-muted-foreground)]',
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
