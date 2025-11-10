'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { cn } from '@/libs/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={cn('flex items-center justify-center gap-2 py-4', className)}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pageNumbers[0] > 1 && (
        <>
          <Button
            variant="ghost"
            onClick={() => handlePageClick(1)}
            className="w-10"
          >
            1
          </Button>
          {pageNumbers[0] > 2 && (
            <span className="text-muted-foreground px-1">…</span>
          )}
        </>
      )}

      {pageNumbers.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'ghost'}
          onClick={() => handlePageClick(page)}
          className="w-10"
        >
          {page}
        </Button>
      ))}

      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="text-muted-foreground px-1">…</span>
          )}
          <Button
            variant="ghost"
            onClick={() => handlePageClick(totalPages)}
            className="w-10"
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
