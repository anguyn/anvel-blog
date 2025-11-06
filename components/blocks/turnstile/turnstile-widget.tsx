'use client';

import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, useImperativeHandle, forwardRef } from 'react';
import { useTheme } from 'next-themes';
import { useLocale } from '@/libs/hooks/use-locale';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
  action?: string;
}

export interface TurnstileWidgetRef {
  reset: () => void;
  remove: () => void;
  getResponse: () => string | undefined;
}

export const TurnstileWidget = forwardRef<
  TurnstileWidgetRef,
  TurnstileWidgetProps
>(({ onSuccess, onError, onExpire, className, action }, ref) => {
  const { locale } = useLocale();
  const { theme } = useTheme();
  const turnstileRef = useRef<TurnstileInstance>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      turnstileRef.current?.reset();
    },
    remove: () => {
      turnstileRef.current?.remove();
    },
    getResponse: () => {
      return turnstileRef.current?.getResponse();
    },
  }));

  return (
    <Turnstile
      ref={turnstileRef}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
      options={{
        language: locale,
        action: action,
        theme: theme === 'dark' ? 'dark' : 'light',
        size: 'flexible',
        retry: 'auto',
        refreshExpired: 'auto',
        appearance: 'always',
        execution: 'render',
      }}
      className={className}
    />
  );
});

TurnstileWidget.displayName = 'TurnstileWidget';
