import Link from 'next/link';
import { FileCode, BookOpen, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export interface SearchResult {
  id: string;
  title: string;
  type: 'snippet' | 'blog' | 'user';
  language?: string;
  excerpt?: string;
  author?: string;
  username?: string;
  name?: string;
}

interface SearchResultItemProps {
  result: SearchResult;
  locale: string;
  onClose: () => void;
}

export function SearchResultItem({
  result,
  locale,
  onClose,
}: SearchResultItemProps) {
  if (result.type === 'snippet') {
    return (
      <Link
        href={`/${locale}/snippets/${result.id}`}
        onClick={onClose}
        className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-secondary)]"
      >
        <FileCode className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-[var(--color-foreground)]">
            {result.title}
          </div>
          <div className="text-xs text-[var(--color-muted-foreground)]">
            {result.language} • by {result.author}
          </div>
        </div>
      </Link>
    );
  }

  if (result.type === 'blog') {
    return (
      <Link
        href={`/${locale}/blog/${result.id}`}
        onClick={onClose}
        className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-secondary)]"
      >
        <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-[var(--color-foreground)]">
            {result.title}
          </div>
          <div className="text-xs text-[var(--color-muted-foreground)]">
            by {result.author}
          </div>
        </div>
      </Link>
    );
  }

  if (result.type === 'user') {
    return (
      <Link
        href={`/${locale}/users/${result.username}`}
        onClick={onClose}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-secondary)]"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)]">
          <UserIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-[var(--color-foreground)]">
            {result.name}
          </div>
          <div className="text-xs text-[var(--color-muted-foreground)]">
            @{result.username}
          </div>
        </div>
      </Link>
    );
  }

  return null;
}

interface SearchResultsListProps {
  results: SearchResult[];
  locale: string;
  searchQuery: string;
  onClose: () => void;
}

export function SearchResultsList({
  results,
  locale,
  searchQuery,
  onClose,
}: SearchResultsListProps) {
  const t = useTranslations('common');

  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>,
  );

  return (
    <div className="p-2">
      {groupedResults.snippet && (
        <div className="mb-4">
          <div className="px-3 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
            {t('search.snippets')}
          </div>
          <div className="space-y-1">
            {groupedResults.snippet.slice(0, 3).map(result => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <SearchResultItem
                  result={result}
                  locale={locale}
                  onClose={onClose}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {groupedResults.blog && (
        <div className="mb-4">
          <div className="px-3 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
            {t('search.blogs')}
          </div>
          <div className="space-y-1">
            {groupedResults.blog.slice(0, 2).map(result => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <SearchResultItem
                  result={result}
                  locale={locale}
                  onClose={onClose}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {groupedResults.user && (
        <div className="mb-4">
          <div className="px-3 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
            {t('search.users')}
          </div>
          <div className="space-y-1">
            {groupedResults.user.map(result => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SearchResultItem
                  result={result}
                  locale={locale}
                  onClose={onClose}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/${locale}/search?q=${encodeURIComponent(searchQuery)}`}
        onClick={onClose}
        className="mt-2 block w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-secondary)]"
      >
        {t('search.viewAllResults')} →
      </Link>
    </div>
  );
}
