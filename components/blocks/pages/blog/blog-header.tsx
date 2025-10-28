import { PaginationMeta } from '@/types';

interface BlogHeaderProps {
  searchParams: {
    search?: string;
  };
  translations: {
    allPosts: string;
    searchResults: string;
    postsFound: string;
    postFound: string;
  };
  pagination: PaginationMeta;
}

export function BlogHeader({
  searchParams,
  translations,
  pagination,
}: BlogHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="mb-2 text-4xl font-bold">
        {searchParams.search
          ? translations.searchResults
          : translations.allPosts}
      </h1>
      <p className="text-muted-foreground text-lg">
        {pagination.total}{' '}
        {pagination.total !== 1
          ? translations.postsFound
          : translations.postFound}
      </p>
    </div>
  );
}
