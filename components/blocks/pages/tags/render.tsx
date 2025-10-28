'use client';

import { Badge } from '@/components/common/badge';
import { Card, CardContent } from '@/components/common/card';
import { Tag } from '@/types';
import { Hash, Code } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface TagsTranslations {
  browseByTags: string;
  description: string;
  topics: string;
  languages: string;
  snippet: string;
  snippets: string;
  noTopicsFound: string;
  noLanguagesFound: string;
}

interface TagsRenderBlockProps {
  locale: string;
  translations: TagsTranslations;
  topicTags: Tag[];
  languageTags: Tag[];
  searchParams: {
    type?: string;
  };
}

export function TagsRenderBlock({
  locale,
  translations,
  topicTags,
  languageTags,
  searchParams,
}: TagsRenderBlockProps) {
  const router = useRouter();
  const pathname = usePathname();

  const displayTags =
    searchParams?.type === 'language' ? languageTags : topicTags;
  const isTopics = !searchParams?.type || searchParams?.type === 'topic';

  const handleTabClick = (type: 'topic' | 'language') => {
    if (type === 'topic') {
      router.push(`/${locale}/tags`);
    } else {
      router.push(`/${locale}/tags?type=language`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">{translations.browseByTags}</h1>
          <p className="text-lg text-[var(--color-muted-foreground)]">
            {translations.description}
          </p>

          <div className="flex gap-2 border-b border-[var(--color-border)]">
            <button
              onClick={() => handleTabClick('topic')}
              className={`border-b-2 px-4 py-2 transition-colors hover:cursor-pointer ${
                isTopics
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {translations.topics} ({topicTags.length})
            </button>
            <button
              onClick={() => handleTabClick('language')}
              className={`border-b-2 px-4 py-2 transition-colors hover:cursor-pointer ${
                searchParams?.type === 'language'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {translations.languages} ({languageTags.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {displayTags.map(tag => (
            <Link key={tag.id} href={`/${locale}/tags/${tag.slug}`}>
              <Card className="h-full cursor-pointer pt-6 transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                      {tag.type === 'LANGUAGE' ? (
                        <Code className="h-5 w-5 text-[var(--color-primary)]" />
                      ) : (
                        <Hash className="h-5 w-5 text-[var(--color-primary)]" />
                      )}
                    </div>
                    <Badge variant="secondary">
                      {tag._count?.snippets || 0}
                    </Badge>
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">{tag.name}</h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {tag._count?.snippets || 0}{' '}
                    {tag._count?.snippets !== 1
                      ? translations.snippets
                      : translations.snippet}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {displayTags.length === 0 && (
          <Card className="pt-6">
            <CardContent className="p-12 text-center">
              <p className="text-[var(--color-muted-foreground)]">
                {isTopics
                  ? translations.noTopicsFound
                  : translations.noLanguagesFound}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
