'use client';

import { SnippetCard } from '@/components/blocks/snippet-card';
import { Card, CardContent } from '@/components/common/card';
import { Badge } from '@/components/common/badge';
import { SearchResults } from '@/types';
import { Search, Code, Hash, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

interface SearchRenderBlockProps {
  results: SearchResults;
  query: string;
  type: string;
  locale: string;
  translations: {
    searchResults: string;
    foundResults: string;
    result: string;
    results: string;
    for: string;
    all: string;
    snippets: string;
    tags: string;
    users: string;
    enterSearchQuery: string;
    noResultsFound: string;
    snippetsCount: string;
  };
}

export function SearchRenderBlock({
  results,
  query,
  type,
  locale,
  translations: t,
}: SearchRenderBlockProps) {
  const snippets = results?.snippets || [];
  const tags = results?.tags || [];
  const users = results?.users || [];

  const totalResults = snippets.length + tags.length + users.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{t.searchResults}</h1>
          {query && (
            <p className="text-[var(--color-muted-foreground)]">
              {t.foundResults} {totalResults}{' '}
              {totalResults !== 1 ? t.results : t.result} {t.for} "
              <span className="font-semibold text-[var(--color-foreground)]">
                {query}
              </span>
              "
            </p>
          )}

          <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)]">
            <Link
              href={`/${locale}/search?q=${query}`}
              className={`border-b-2 px-4 py-2 whitespace-nowrap transition-colors ${
                type === 'all'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {t.all} ({totalResults})
            </Link>
            <Link
              href={`/${locale}/search?q=${query}&type=snippets`}
              className={`border-b-2 px-4 py-2 whitespace-nowrap transition-colors ${
                type === 'snippets'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {t.snippets} ({snippets.length})
            </Link>
            <Link
              href={`/${locale}/search?q=${query}&type=tags`}
              className={`border-b-2 px-4 py-2 whitespace-nowrap transition-colors ${
                type === 'tags'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {t.tags} ({tags.length})
            </Link>
            <Link
              href={`/${locale}/search?q=${query}&type=users`}
              className={`border-b-2 px-4 py-2 whitespace-nowrap transition-colors ${
                type === 'users'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {t.users} ({users.length})
            </Link>
          </div>
        </div>

        {!query ? (
          <Card className="pt-6">
            <CardContent className="p-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted-foreground)]" />
              <p className="text-[var(--color-muted-foreground)]">
                {t.enterSearchQuery}
              </p>
            </CardContent>
          </Card>
        ) : totalResults === 0 ? (
          <Card className="pt-6">
            <CardContent className="p-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted-foreground)]" />
              <p className="text-[var(--color-muted-foreground)]">
                {t.noResultsFound} "{query}"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {(type === 'all' || type === 'snippets') && snippets.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  <h2 className="text-2xl font-bold">{t.snippets}</h2>
                  <Badge variant="secondary">{snippets.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {snippets.map(snippet => (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            )}

            {(type === 'all' || type === 'tags') && tags.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  <h2 className="text-2xl font-bold">{t.tags}</h2>
                  <Badge variant="secondary">{tags.length}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {tags.map(tag => (
                    <Link key={tag.id} href={`/${locale}/tags/${tag.slug}`}>
                      <Card className="cursor-pointer pt-6 transition-shadow hover:shadow-lg">
                        <CardContent className="p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-[var(--color-primary)]" />
                            <h3 className="truncate font-semibold">
                              {tag.name}
                            </h3>
                          </div>
                          <p className="text-xs text-[var(--color-muted-foreground)]">
                            {tag._count?.snippets || 0} {t.snippetsCount}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(type === 'all' || type === 'users') && users.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  <h2 className="text-2xl font-bold">{t.users}</h2>
                  <Badge variant="secondary">{users.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {users.map(user => (
                    <Link
                      key={user.id}
                      href={`/${locale}/users/${user.username}`}
                    >
                      <Card className="cursor-pointer pt-6 transition-shadow hover:shadow-lg">
                        <CardContent className="flex items-center gap-4 p-4">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || 'User'}
                              className="h-12 w-12 rounded-full"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                              <UserIcon className="h-6 w-6" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold">
                              {user.name || user.username}
                            </h3>
                            <p className="truncate text-sm text-[var(--color-muted-foreground)]">
                              @{user.username}
                            </p>
                            {user.bio && (
                              <p className="mt-1 truncate text-xs text-[var(--color-muted-foreground)]">
                                {user.bio}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {(user as any)._count?.snippets || 0}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
