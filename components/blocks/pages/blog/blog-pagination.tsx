'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/common/button';
import { PaginationMeta } from '@/types';

interface BlogPaginationProps {
  pagination: PaginationMeta;
  locale: string;
  translations: {
    previous: string;
    next: string;
  };
}

export function BlogPagination({
  pagination,
  locale,
  translations,
}: BlogPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set('page', String(newPage));

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPage = pagination.page;

  return (
    <div className="mt-12 flex justify-center gap-2">
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
  );
}
