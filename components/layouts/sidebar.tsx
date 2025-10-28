'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/common/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Language, Tag } from '@/types';
import { Hash, TrendingUp, Code } from 'lucide-react';
import { cn } from '@/libs/utils';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  locale: string;
}

interface LanguageSidebar extends Language {
  _count?: {
    snippets: number;
  };
}

export function Sidebar({ locale }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('common');

  const [languages, setLanguages] = useState<LanguageSidebar[]>([]);
  const [topics, setTopics] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentLanguage = searchParams?.get('language');
  const currentTag = searchParams?.get('tag');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [languagesRes, topicsRes] = await Promise.all([
          fetch('/api/languages'),
          fetch('/api/tags?type=topic'),
        ]);

        if (languagesRes.ok) {
          const languagesData: LanguageSidebar[] = await languagesRes.json();
          setLanguages(languagesData.slice(0, 10));
        }

        if (topicsRes.ok) {
          const topicsData: Tag[] = await topicsRes.json();
          setTopics(topicsData.slice(0, 10));
        }
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const createFilterUrl = (filterKey: string, filterValue: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set(filterKey, filterValue);
    params.delete('page');
    return `${pathname}?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <aside className="w-full space-y-4 lg:w-64">
        <Card>
          <CardHeader>
            <div className="h-5 animate-pulse rounded bg-[var(--color-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded bg-[var(--color-secondary)]"
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-5 animate-pulse rounded bg-[var(--color-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded bg-[var(--color-secondary)]"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="w-full space-y-4 lg:w-64">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code className="h-4 w-4" />
            {t('popularLanguages')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {languages.map(lang => {
              const isActive = currentLanguage === lang.slug;
              return (
                <Link
                  key={lang.id}
                  href={createFilterUrl('language', lang.slug)}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                      : 'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
                  )}
                >
                  <span className="flex items-center gap-2">
                    {lang.icon && (
                      <img src={lang.icon} alt="" className="h-4 w-4" />
                    )}
                    {lang.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {lang._count?.snippets || 0}
                  </Badge>
                </Link>
              );
            })}
          </div>
          <Link
            href={`/${locale}/languages`}
            className="mt-3 block text-sm text-[var(--color-primary)] hover:underline"
          >
            {t('viewAllLanguages')}
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            {t('trendingTopics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {topics.map(topic => {
              const isActive = currentTag === topic.slug;
              return (
                <Link
                  key={topic.id}
                  href={createFilterUrl('tag', topic.slug)}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                      : 'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    {topic.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {topic._count?.snippets || 0}
                  </Badge>
                </Link>
              );
            })}
          </div>
          <Link
            href={`/${locale}/tags?type=topic`}
            className="mt-3 block text-sm text-[var(--color-primary)] hover:underline"
          >
            {t('viewAllTopics')}
          </Link>
        </CardContent>
      </Card>
    </aside>
  );
}
