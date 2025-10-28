'use client';

import { Sidebar } from '@/components/layouts/sidebar';
import { SnippetCard } from '@/components/blocks/snippet-card';
import { LoadingCard } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Snippet, PaginationMeta } from '@/types';
import { Suspense, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

interface SnippetsTranslations {
  allSnippets: string;
  searchResults: string;
  snippetsFound: string;
  snippetFound: string;
  mostRecent: string;
  mostViewed: string;
  mostLiked: string;
  language: string;
  tag: string;
  search: string;
  noSnippetsFound: string;
  previous: string;
  next: string;
}

interface SnippetsRenderBlockProps {
  locale: string;
  translations: SnippetsTranslations;
  snippets: Snippet[];
  pagination: PaginationMeta;
  searchParams: {
    page?: string;
    language?: string;
    tag?: string;
    search?: string;
    sortBy?: string;
  };
}

export function SnippetsRenderBlock({
  locale,
  translations,
  snippets,
  pagination,
  searchParams,
}: SnippetsRenderBlockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const currentPage = pagination.page;
  const [isPending, startTransition] = useTransition();

  const createQueryString = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(currentSearchParams?.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    return params.toString();
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortBy = e.target.value;
    const query = createQueryString({ sortBy, page: '1' });
    startTransition(() => {
      router.push(`${pathname}?${query}`);
    });
  };

  const removeFilter = (filterKey: string) => {
    const query = createQueryString({ [filterKey]: null, page: '1' });
    startTransition(() => {
      router.push(`${pathname}?${query}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const query = createQueryString({ page: String(newPage) });
    startTransition(() => {
      router.push(`${pathname}?${query}`);
    });
  };

  const renderContent = () => {
    if (snippets.length > 0) {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {snippets.map(snippet => (
            <SnippetCard key={snippet.id} snippet={snippet} locale={locale} />
          ))}
        </div>
      );
    } else {
      return (
        <div className="py-12 text-center">
          <p className="text-lg text-[var(--color-muted-foreground)]">
            {translations.noSnippetsFound}
          </p>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <Sidebar locale={locale} />

        <div className="flex-1 space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold">
                {searchParams.search
                  ? translations.searchResults
                  : translations.allSnippets}
              </h1>
              <p className="mt-1 text-[var(--color-muted-foreground)]">
                {pagination.total}{' '}
                {pagination.total !== 1
                  ? translations.snippetsFound
                  : translations.snippetFound}
              </p>
            </div>

            <div className="flex gap-2">
              <select
                className="rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-4 py-2 text-sm"
                value={searchParams.sortBy || 'recent'}
                onChange={handleSortChange}
              >
                <option value="recent">{translations.mostRecent}</option>
                <option value="viewed">{translations.mostViewed}</option>
                <option value="liked">{translations.mostLiked}</option>
              </select>
            </div>
          </div>

          {(searchParams.language ||
            searchParams.tag ||
            searchParams.search) && (
            <div className="flex flex-wrap gap-2">
              {searchParams.language && (
                <div className="flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-3 py-1 text-sm">
                  {translations.language}: {searchParams.language}
                  <button
                    className="hover:cursor-pointer hover:text-[var(--color-destructive)]"
                    onClick={() => removeFilter('language')}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {searchParams.tag && (
                <div className="flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-3 py-1 text-sm">
                  {translations.tag}: {searchParams.tag}
                  <button
                    className="hover:cursor-pointer hover:text-[var(--color-destructive)]"
                    onClick={() => removeFilter('tag')}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {searchParams.search && (
                <div className="flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-3 py-1 text-sm">
                  {translations.search}: {searchParams.search}
                  <button
                    className="hover:cursor-pointer hover:text-[var(--color-destructive)]"
                    onClick={() => removeFilter('search')}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {isPending ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : (
            <Suspense fallback={null}>{renderContent()}</Suspense>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1 || isPending}
                onClick={() => {
                  if (currentPage > 1) {
                    handlePageChange(currentPage - 1);
                  }
                }}
              >
                {translations.previous}
              </Button>

              <div className="flex gap-1">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? 'default' : 'outline'
                        }
                        disabled={isPending}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="px-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                disabled={currentPage === pagination.totalPages || isPending}
                onClick={() => {
                  if (currentPage < pagination.totalPages) {
                    handlePageChange(currentPage + 1);
                  }
                }}
              >
                {translations.next}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
