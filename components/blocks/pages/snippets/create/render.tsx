'use client';

import { SnippetForm } from '@/components/blocks/snippet-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';

interface Language {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface SnippetTranslations {
  title: string;
  description: string;
}

interface SnippetCreateBlockProps {
  languages: Language[];
  locale: string;
  translations: SnippetTranslations;
}

export function SnippetCreateBlock({
  languages,
  locale,
  translations,
}: SnippetCreateBlockProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{translations.title || 'Create New Snippet'}</CardTitle>
            <CardDescription>{translations.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <SnippetForm locale={locale} languages={languages} mode="create" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
