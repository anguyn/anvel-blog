'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/common/card';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundRenderBlock() {
  const router = useRouter();
  const t = useTranslations('notFound');

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-3xl">
        <Card className="overflow-hidden pt-6">
          <CardContent className="flex flex-col items-center gap-8 p-8 md:flex-row">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                404
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {t('description')}
              </p>

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
                <Button
                  onClick={() => router.back()}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> {t('back')}
                </Button>

                <Link href="/" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">{t('home')}</Button>
                </Link>
              </div>

              <p className="text-muted-foreground mt-4 text-sm">
                {t('contact')}
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <svg
                width="220"
                height="160"
                viewBox="0 0 220 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <rect
                  x="10"
                  y="10"
                  width="200"
                  height="140"
                  rx="12"
                  fill="#EFF6FF"
                />
                <path d="M60 110 L90 60 L120 110 Z" fill="#A78BFA" />
                <circle cx="160" cy="60" r="20" fill="#60A5FA" />
                <text
                  x="110"
                  y="95"
                  textAnchor="middle"
                  fontSize="18"
                  fill="#1F2937"
                >
                  404
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
