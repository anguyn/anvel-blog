'use client';

import { ThemeProvider } from 'next-themes';
import { PropsWithChildren } from 'react';
import { LocaleInitializer } from './locale-initializer';
import { Toaster as Sonner } from 'sonner';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useAuthSync } from '@/libs/hooks/use-auth-sync';

interface ProvidersProps extends PropsWithChildren {
  locale?: 'en' | 'vi';
}

function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  useAuthSync();
  return <>{children}</>;
}

const Providers = ({ children, locale }: ProvidersProps) => {
  return (
    <NextAuthSessionProvider refetchInterval={5 * 60} refetchOnWindowFocus>
      <AuthSyncProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="code-bin"
        >
          <LocaleInitializer initialLocale={locale} />
          <div id="site-wrapper">
            {children}
            <Sonner
              position="top-center"
              closeButton
              theme="light"
              toastOptions={{
                style: {
                  borderRadius: '8px',
                },
              }}
            />
          </div>
        </ThemeProvider>
      </AuthSyncProvider>
    </NextAuthSessionProvider>
  );
};

export { Providers };
