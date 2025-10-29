import { Card, CardContent } from '@/components/common/card';
import { Badge } from '@/components/common/badge';
import { Snippet } from '@/types';

interface UserTopLanguagesProps {
  snippets: Snippet[];
  translations: {
    topLanguages: string;
  };
}

export function UserTopLanguages({
  snippets,
  translations,
}: UserTopLanguagesProps) {
  const languageStats = snippets.reduce(
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

  if (topLanguages.length === 0) return null;

  return (
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
  );
}
