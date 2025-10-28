'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';

interface CookieConsentProps {
  locale: string;
}

export function CookieConsent({ locale }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 p-4 shadow-lg backdrop-blur-sm md:p-6">
      <div className="container mx-auto">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-start gap-3">
            <Cookie className="mt-1 h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />
            <div className="flex-1">
              <h3 className="mb-1 font-semibold">Cookie Notice</h3>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                We use cookies to enhance your experience, analyze site traffic,
                and personalize content. By clicking "Accept", you consent to
                our use of cookies.{' '}
                <Link
                  href={`/${locale}/cookie-policy`}
                  className="text-[var(--color-primary)] underline hover:no-underline"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={declineCookies}
              className="w-full sm:w-auto"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={acceptCookies}
              className="w-full sm:w-auto"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
