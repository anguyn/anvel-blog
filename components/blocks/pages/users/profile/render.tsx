'use client';

import { SnippetCard } from '@/components/blocks/snippet-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/common/card';
import { Badge } from '@/components/common/badge';
import { User, Snippet } from '@/types';
import { formatDate } from '@/libs/utils';
import { Calendar, Code2, Edit } from 'lucide-react';
import Link from 'next/link';

interface UserProfileTranslations {
  editProfile: string;
  joined: string;
  snippet: string;
  snippets: string;
  snippetsLabel: string;
  views: string;
  favorites: string;
  languages: string;
  topLanguages: string;
  mySnippets: string;
  publicSnippets: string;
  createNew: string;
  noSnippetsYet: string;
  noPublicSnippets: string;
}

interface UserProfileRenderBlockProps {
  locale: string;
  translations: UserProfileTranslations;
  user: User;
  snippets: Snippet[];
  isOwner: boolean;
}

export function UserProfileRenderBlock({
  locale,
  translations,
  user,
  snippets,
  isOwner,
}: UserProfileRenderBlockProps) {
  const publicSnippets = snippets.filter(s => s.isPublic);
  const displaySnippets = isOwner ? snippets : publicSnippets;

  const languageStats = displaySnippets.reduce(
    (acc, snippet) => {
      const lang = snippet.language.name;
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topLanguages = Object.entries(languageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto space-y-8">
        <Card className="pt-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-shrink-0">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="h-32 w-32 rounded-full border-4 border-[var(--color-border)] object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-[var(--color-border)] bg-[var(--color-secondary)]">
                    <Code2 className="h-16 w-16 text-[var(--color-muted-foreground)]" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                  <div>
                    <h1 className="text-3xl font-bold">
                      {user.name || user.username}
                    </h1>
                    <p className="mt-1 text-[var(--color-muted-foreground)]">
                      @{user.username}
                    </p>
                  </div>
                  {isOwner && (
                    <Button disabled variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/settings`}>
                        <Edit className="mr-2 h-4 w-4" />
                        {translations.editProfile}
                      </Link>
                    </Button>
                  )}
                </div>

                {user.bio && (
                  <p className="text-[var(--color-foreground)]">{user.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)]">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {translations.joined} {formatDate(user.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Code2 className="h-4 w-4" />
                    {displaySnippets.length}{' '}
                    {displaySnippets.length !== 1
                      ? translations.snippets
                      : translations.snippet}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4">
                  <div className="rounded-lg bg-[var(--color-secondary)] p-3 text-center">
                    <div className="text-2xl font-bold">
                      {displaySnippets.length}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.snippetsLabel}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--color-secondary)] p-3 text-center">
                    <div className="text-2xl font-bold">
                      {displaySnippets.reduce((sum, s) => sum + s.viewCount, 0)}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.views}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--color-secondary)] p-3 text-center">
                    <div className="text-2xl font-bold">
                      {displaySnippets.reduce(
                        (sum, s) => sum + (s._count?.favorites || 0),
                        0,
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.favorites}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--color-secondary)] p-3 text-center">
                    <div className="text-2xl font-bold">
                      {topLanguages.length}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.languages}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {topLanguages.length > 0 && (
          <Card className="pt-6">
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">
                {translations.topLanguages}
              </h2>
              <div className="flex flex-wrap gap-2">
                {topLanguages.map(([lang, count]) => (
                  <Badge key={lang} variant="secondary">
                    {lang} ({count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {isOwner ? translations.mySnippets : translations.publicSnippets}
            </h2>
            {isOwner && (
              <Button asChild>
                <Link href={`/${locale}/snippets/new`}>
                  <Code2 className="mr-2 h-4 w-4" />
                  {translations.createNew}
                </Link>
              </Button>
            )}
          </div>

          {displaySnippets.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displaySnippets.map(snippet => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Code2 className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted-foreground)]" />
                <p className="text-[var(--color-muted-foreground)]">
                  {isOwner
                    ? translations.noSnippetsYet
                    : translations.noPublicSnippets}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
