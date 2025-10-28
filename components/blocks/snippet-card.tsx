'use client';

import { Snippet } from '@/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/common/card';
import { Badge } from '@/components/common/badge';
import { formatDate, getLanguageColor, truncateCode } from '@/libs/utils';
import { Eye, Heart, User } from 'lucide-react';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SnippetCardProps {
  snippet: Snippet;
  locale: string;
}

export function SnippetCard({ snippet, locale }: SnippetCardProps) {
  const languageColor = getLanguageColor(snippet.language?.name || 'other');

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/${locale}/snippets/${snippet.slug}`} className="flex-1">
            <h3 className="hover:text-primary line-clamp-2 text-lg font-semibold transition-colors">
              {snippet.title}
            </h3>
          </Link>
          {snippet.complexity && (
            <Badge variant="outline" className="shrink-0">
              {snippet.complexity}
            </Badge>
          )}
        </div>

        {snippet.description && (
          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
            {snippet.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pb-3">
        <div className="code-block flex-1">
          <SyntaxHighlighter
            language={snippet.language?.name || 'other'}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              maxHeight: '200px',
            }}
            showLineNumbers
          >
            {truncateCode(snippet.code, 100)}
            {snippet.code.length > 100 ? '...' : ''}
          </SyntaxHighlighter>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge
            style={{
              backgroundColor: `${languageColor}15`,
              color: languageColor,
              borderColor: languageColor,
            }}
            variant="outline"
          >
            {snippet.language?.name || 'Other'}
          </Badge>
          {snippet.tags.slice(0, 3).map(
            ({ tag }) =>
              tag.type === 'TOPIC' && (
                <Link key={tag.id} href={`/${locale}/tags/${tag.slug}`}>
                  <Badge variant="secondary" className="hover:bg-secondary/80">
                    {tag.name}
                  </Badge>
                </Link>
              ),
          )}
        </div>
      </CardContent>

      <CardFooter className="text-muted-foreground flex items-center justify-between border-t pt-3 text-sm">
        <Link
          href={`/${locale}/users/${snippet.user.username}`}
          className="hover:text-foreground flex items-center gap-2 transition-colors"
        >
          {snippet.user.image ? (
            <img
              src={snippet.user.image}
              alt={snippet.user.name || 'User'}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <div className="bg-secondary flex h-6 w-6 items-center justify-center rounded-full">
              <User className="h-4 w-4" />
            </div>
          )}
          <span>{snippet.user.name || snippet.user.username}</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{snippet.viewCount}</span>
          </div>
          {snippet._count && (
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{snippet._count.favorites}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
