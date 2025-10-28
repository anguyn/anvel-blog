'use client';

import { Sidebar } from '@/components/layouts/sidebar';
import { SnippetCard } from '@/components/blocks/snippet-card';
import { Badge } from '@/components/common/badge';
import { Button } from '@/components/ui/button';
import { Tag, Snippet, PaginationMeta } from '@/types';
import { Hash, Code } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, Suspense } from 'react';
import { LoadingCard } from '@/components/common/loading';

interface TagDetailTranslations {
  language: string;
  topic: string;
  snippet: string;
  snippets: string;
  found: string;
  noSnippetsFound: string;
  mostRecent: string;
  mostViewed: string;
  mostLiked: string;
  previous: string;
  next: string;
}

interface TagDetailRenderBlockProps {
  locale: string;
  translations: TagDetailTranslations;
  tag: Tag;
  snippets: Snippet[];
  pagination: PaginationMeta;
  searchParams: {
    page?: string;
    sortBy?: string;
    limit?: string;
  };
}

export function TagDetailRenderBlock({
  locale,
  translations,
  tag,
  snippets,
  pagination,
  searchParams,
}: TagDetailRenderBlockProps) {
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
        <div className="rounded-lg border border-dashed border-[var(--color-border)] py-12 text-center">
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
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                  {tag.type === 'LANGUAGE' ? (
                    <Code className="h-8 w-8 text-[var(--color-primary)]" />
                  ) : (
                    <Hash className="h-8 w-8 text-[var(--color-primary)]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">{tag.name}</h1>
                    <Badge variant="secondary">
                      {tag.type === 'LANGUAGE'
                        ? translations.language
                        : translations.topic}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[var(--color-muted-foreground)]">
                    {pagination.total}{' '}
                    {pagination.total !== 1
                      ? translations.snippets
                      : translations.snippet}{' '}
                    {translations.found}
                  </p>
                </div>
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
          </div>

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
