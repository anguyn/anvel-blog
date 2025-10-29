import { Card, CardContent } from '@/components/common/card';

interface UserProfileStatsProps {
  snippetsCount: number;
  viewsCount: number;
  favoritesCount: number;
  languagesCount: number;
  translations: {
    snippetsLabel: string;
    views: string;
    favorites: string;
    languages: string;
  };
}

export function UserProfileStats({
  snippetsCount,
  viewsCount,
  favoritesCount,
  languagesCount,
  translations,
}: UserProfileStatsProps) {
  return (
    <Card className="pt-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-[var(--color-secondary)] p-4 text-center">
            <div className="text-3xl font-bold text-[var(--color-foreground)]">
              {snippetsCount}
            </div>
            <div className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {translations.snippetsLabel}
            </div>
          </div>

          <div className="rounded-lg bg-[var(--color-secondary)] p-4 text-center">
            <div className="text-3xl font-bold text-[var(--color-foreground)]">
              {viewsCount.toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {translations.views}
            </div>
          </div>

          <div className="rounded-lg bg-[var(--color-secondary)] p-4 text-center">
            <div className="text-3xl font-bold text-[var(--color-foreground)]">
              {favoritesCount}
            </div>
            <div className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {translations.favorites}
            </div>
          </div>

          <div className="rounded-lg bg-[var(--color-secondary)] p-4 text-center">
            <div className="text-3xl font-bold text-[var(--color-foreground)]">
              {languagesCount}
            </div>
            <div className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {translations.languages}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
