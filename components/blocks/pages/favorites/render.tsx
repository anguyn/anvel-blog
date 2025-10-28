'use client';

import { SnippetCard } from '@/components/blocks/snippet-card';
import { Card, CardContent } from '@/components/common/card';
import { LoadingCard } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import { Snippet, PaginationMeta } from '@/types';
import { Heart } from 'lucide-react';
import { Suspense, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface FavoritesTranslations {
  title: string;
  savedSnippet: string;
  pluralSuffix: string;
  noFavoritesYet: string;
  noFavoritesDescription: string;
  previous: string;
  next: string;
}

interface FavoritesRenderBlockProps {
  favorites: Snippet[];
  pagination: PaginationMeta;
  translations: FavoritesTranslations;
  locale: string;
  searchParams: {
    page?: string;
  };
}

export function FavoritesRenderBlock({
  favorites,
  pagination,
  translations,
  locale,
  searchParams,
}: FavoritesRenderBlockProps) {
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

  const handlePageChange = (newPage: number) => {
    const query = createQueryString({ page: String(newPage) });
    startTransition(() => {
      router.push(`${pathname}?${query}`);
    });
  };

  const renderContent = () => {
    if (favorites.length > 0) {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {favorites.map(snippet => (
            <SnippetCard key={snippet.id} snippet={snippet} locale={locale} />
          ))}
        </div>
      );
    } else {
      return (
        <Card className="pt-6">
          <CardContent className="p-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted-foreground)]" />
            <p className="mb-2 text-lg text-[var(--color-muted-foreground)]">
              {translations.noFavoritesYet}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {translations.noFavoritesDescription}
            </p>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
            <Heart className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{translations.title}</h1>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              {pagination.total} {translations.savedSnippet}
              {pagination.total !== 1 ? translations.pluralSuffix : ''}
            </p>
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
                      variant={currentPage === pageNum ? 'default' : 'outline'}
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
  );
}
