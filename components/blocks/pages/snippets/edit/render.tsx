'use client';

import { SnippetForm } from '@/components/blocks/snippet-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Snippet } from '@/types';

interface Language {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface SnippetEditBlockProps {
  title: string;
  snippet: Snippet;
  languages: Language[];
  locale: string;
}

export function SnippetEditBlock({
  title,
  snippet,
  languages,
  locale,
}: SnippetEditBlockProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{title || 'Edit Snippet'}</CardTitle>
          </CardHeader>
          <CardContent>
            <SnippetForm
              locale={locale}
              snippet={snippet}
              languages={languages}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
