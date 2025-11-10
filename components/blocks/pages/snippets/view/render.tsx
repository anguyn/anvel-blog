'use client';

import { Button } from '@/components/ui/button';
import { Button as Button2 } from '@/components/common/button';
import { Badge } from '@/components/common/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { CopyButton } from '@/components/custom/copy-button';
import { Snippet } from '@/types';
import { formatDate, getLanguageColor, normalizeLanguage } from '@/libs/utils';
import { Eye, Heart, Calendar, Code, User, Edit } from 'lucide-react';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscDarkPlus,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { useCurrentUser } from '@/libs/hooks/use-current-user';
import { DeleteSnippetDialog } from '@/components/blocks/delete-snippet-dialog';
import { cn } from '@/libs/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface SnippetTranslations {
  share: string;
  save: string;
  saved: string;
  edit: string;
  delete: string;
  views: string;
  saves: string;
  code: string;
  timeComplexity: string;
  estimatedComplexity: string;
  complexityDisclaimer: string;
  aboutAuthor: string;
  viewProfile: string;
  loginToSave: string;
}

interface SnippetViewBlockProps {
  snippet: Snippet;
  locale: string;
  isFavorited: boolean;
  translations: SnippetTranslations;
}

export function SnippetViewBlock({
  snippet,
  locale,
  isFavorited: initialIsFavorited,
  translations,
}: SnippetViewBlockProps) {
  const languageColor = getLanguageColor(snippet.language.name);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/snippets/${snippet.slug}`;

  const { user } = useCurrentUser();
  const router = useRouter();
  const tC = useTranslations('common');
  const { resolvedTheme } = useTheme();

  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [favoriteCount, setFavoriteCount] = useState(
    snippet._count?.favorites || 0,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error(translations.loginToSave);
      router.push(
        `/${locale}/login?callbackUrl=/${locale}/snippets/${snippet.slug}`,
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/snippets/${snippet.id}/favorite`, {
        method: isFavorited ? 'DELETE' : 'POST',
      });

      if (!res.ok) throw new Error('Failed to update favorite');

      setIsFavorited(!isFavorited);
      setFavoriteCount(prev => (isFavorited ? prev - 1 : prev + 1));

      toast.success(isFavorited ? tC('favoriteRemoved') : tC('favoriteAdded'));
    } catch (error) {
      toast.error(tC('favoriteError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold">{snippet.title}</h1>
              {snippet.description && (
                <p className="text-[var(--color-muted-foreground)]">
                  {snippet.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <CopyButton text={shareUrl} label={translations.share} />
              {user && (
                <Button2
                  variant="outline"
                  size="sm"
                  onClick={handleFavoriteToggle}
                  disabled={isLoading}
                  className="hover:cursor-pointer"
                >
                  <Heart
                    className={cn(
                      'mr-2 h-4 w-4',
                      isFavorited && 'fill-current text-red-500',
                    )}
                  />
                  {isFavorited ? translations.saved : translations.save}
                </Button2>
              )}
              {user?.id == snippet.user.id && (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-[36px]"
                  >
                    <Link href={`/${locale}/snippets/${snippet.slug}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      {translations.edit}
                    </Link>
                  </Button>
                  <DeleteSnippetDialog
                    snippetId={snippet.id}
                    snippetTitle={snippet.title}
                    locale={locale}
                    onClose={() => {}}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
            <Link
              href={`/${locale}/users/${snippet.user.username}`}
              className="flex items-center gap-2 hover:text-[var(--color-foreground)]"
            >
              {snippet.user.image ? (
                <img
                  src={snippet.user.image}
                  alt={snippet.user.name || 'User'}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                  <User className="h-4 w-4" />
                </div>
              )}
              <span className="font-medium">
                {snippet.user.name || snippet.user.username}
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(snippet.createdAt)}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {snippet.viewCount} {translations.views}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {favoriteCount} {translations.saves}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              style={{
                backgroundColor: `${languageColor}15`,
                color: languageColor,
                borderColor: languageColor,
              }}
              variant="outline"
            >
              {snippet.language.name}
            </Badge>
            {snippet.complexity && (
              <Badge variant="outline" className="gap-1">
                <Code className="h-3 w-3" />
                {snippet.complexity}
              </Badge>
            )}
            {snippet.tags.map(({ tag }) =>
              tag.type === 'TOPIC' ? (
                <Link key={tag.id} href={`/${locale}/tags/${tag.slug}`}>
                  <Badge
                    variant="secondary"
                    className="hover:bg-[var(--color-secondary)]/80"
                  >
                    {tag.name}
                  </Badge>
                </Link>
              ) : null,
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code className="h-5 w-5" />
              {translations.code}
            </CardTitle>
            <CopyButton text={snippet.code} />
          </CardHeader>
          <CardContent className="p-0">
            <div className="code-block">
              <SyntaxHighlighter
                language={normalizeLanguage(snippet.language?.name)}
                style={resolvedTheme === 'dark' ? vscDarkPlus : oneLight}
                customStyle={{
                  margin: 0,
                  borderRadius: '0 0 0.5rem 0.5rem',
                }}
                showLineNumbers
              >
                {snippet.code}
              </SyntaxHighlighter>
            </div>
          </CardContent>
        </Card>

        {snippet.complexity && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {translations.timeComplexity}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[var(--color-primary)]">
                    {snippet.complexity}
                  </span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {translations.estimatedComplexity}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.complexityDisclaimer}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {translations.aboutAuthor}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {snippet.user.image ? (
                <img
                  src={snippet.user.image}
                  alt={snippet.user.name || 'User'}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                  <User className="h-8 w-8" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{snippet.user.name}</h3>
                <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">
                  @{snippet.user.username}
                </p>
                {snippet.user.bio && (
                  <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">
                    {snippet.user.bio}
                  </p>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/users/${snippet.user.username}`}>
                    {translations.viewProfile}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
