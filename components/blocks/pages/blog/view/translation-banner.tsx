'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Languages, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TranslationBannerProps {
  originalLanguage: string;
  currentLanguage: string;
  originalSlug: string;
  locale: string;
}

export function TranslationBanner({
  originalLanguage,
  currentLanguage,
  originalSlug,
  locale,
}: TranslationBannerProps) {
  const languageNames: Record<string, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
  };

  const messages = {
    en: {
      prefix: 'This is a translated version from',
      viewOriginal: 'View original',
    },
    vi: {
      prefix: 'Đây là bản dịch từ',
      viewOriginal: 'Xem bản gốc',
    },
  };

  const msg = messages[currentLanguage as 'en' | 'vi'] || messages.en;

  return (
    <div className="border-b bg-blue-50 dark:bg-blue-950/20">
      <div className="container mx-auto px-4 py-3">
        <Alert className="border-blue-200 bg-transparent">
          <Languages className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="ml-2 flex items-center justify-between">
            <span className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-medium">AI Translation</span>
              {' • '}
              {msg.prefix} {languageNames[originalLanguage]}
            </span>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <Link href={`/${originalLanguage}/blog/${originalSlug}`}>
                {msg.viewOriginal}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
