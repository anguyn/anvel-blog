'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/common/card';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function ForbiddenRenderBlock() {
  const router = useRouter();
  const t = useTranslations('forbidden');

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-3xl">
        <Card className="overflow-hidden pt-6">
          <CardContent className="flex flex-col items-center gap-8 p-8 md:flex-row">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <ShieldAlert className="text-destructive h-8 w-8" />
                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                  403
                </h1>
              </div>
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
                  fill="#FEF2F2"
                />
                <path
                  d="M110 45 L110 85 M110 95 L110 100"
                  stroke="#EF4444"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <circle
                  cx="110"
                  cy="80"
                  r="50"
                  stroke="#DC2626"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  d="M85 55 L135 105 M135 55 L85 105"
                  stroke="#DC2626"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
