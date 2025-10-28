'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/common/input';
import { Search, Filter, X, Grid, List } from 'lucide-react';

interface BlogFiltersProps {
  locale: string;
  searchParams: {
    search?: string;
    category?: string;
    tag?: string;
    type?: string;
    sortBy?: string;
  };
  translations: {
    search: string;
    allTypes: string;
    article: string;
    gallery: string;
    video: string;
    document: string;
    latest: string;
    mostViewed: string;
    trending: string;
    category: string;
    tag: string;
    type: string;
  };
}

export function BlogFilters({
  locale,
  searchParams,
  translations,
}: BlogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(searchParams.search || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = createQueryString({
      search: searchInput || null,
      page: '1',
    });
    startTransition(() => {
      router.push(`${pathname}?${query}`);
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortBy = e.target.value;
    const query = createQueryString({ sortBy, page: '1' });
    startTransition(() => {
      router.push(`${pathname}?${query}`);
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value === 'all' ? null : e.target.value;
    const query = createQueryString({ type, page: '1' });
    startTransition(() => {
      router.push(`${pathname}?${query}`);
    });
  };

  const removeFilter = (filterKey: string) => {
    const query = createQueryString({ [filterKey]: null, page: '1' });
    if (filterKey === 'search') setSearchInput('');
    startTransition(() => {
      router.push(`${pathname}?${query}`);
    });
  };

  return (
    <>
      {/* Filters Bar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearch} className="flex-1 lg:max-w-md">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
            <Input
              type="text"
              placeholder={translations.search}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="border-input bg-background hover:bg-accent rounded-md border px-4 py-2 text-sm transition-colors"
            value={searchParams.type || 'all'}
            onChange={handleTypeChange}
          >
            <option value="all">{translations.allTypes}</option>
            <option value="ARTICLE">{translations.article}</option>
            <option value="GALLERY">{translations.gallery}</option>
            <option value="VIDEO">{translations.video}</option>
            <option value="DOCUMENT">{translations.document}</option>
          </select>

          <select
            className="border-input bg-background hover:bg-accent rounded-md border px-4 py-2 text-sm transition-colors"
            value={searchParams.sortBy || 'latest'}
            onChange={handleSortChange}
          >
            <option value="latest">{translations.latest}</option>
            <option value="viewed">{translations.mostViewed}</option>
            <option value="trending">{translations.trending}</option>
          </select>

          <div className="border-input flex gap-1 rounded-md border p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded px-3 py-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded px-3 py-1 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(searchParams.category ||
        searchParams.tag ||
        searchParams.search ||
        searchParams.type) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {searchParams.category && (
            <div className="bg-secondary flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <Filter className="h-3 w-3" />
              {translations.category}: {searchParams.category}
              <button
                className="hover:text-destructive transition-colors"
                onClick={() => removeFilter('category')}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {searchParams.tag && (
            <div className="bg-secondary flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <Filter className="h-3 w-3" />
              {translations.tag}: {searchParams.tag}
              <button
                className="hover:text-destructive transition-colors"
                onClick={() => removeFilter('tag')}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {searchParams.type && (
            <div className="bg-secondary flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <Filter className="h-3 w-3" />
              {translations.type}: {searchParams.type}
              <button
                className="hover:text-destructive transition-colors"
                onClick={() => removeFilter('type')}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {searchParams.search && (
            <div className="bg-secondary flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <Search className="h-3 w-3" />
              {searchParams.search}
              <button
                className="hover:text-destructive transition-colors"
                onClick={() => removeFilter('search')}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
