'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { DashboardHeader, DashboardHeaderProps } from './header';
import { DashboardSidebar } from './sidebar';
import { useUIStore } from '@/store/ui';
import { useMediaQuery } from '@/libs/hooks/use-media-query';
import { useLocale } from '@/libs/hooks/use-locale';

export interface SystemConfig {
  defaultTitle: string;
  appName: string;
  favicon: string;
  textLogo: string;
  textLogoDark: string;
  logo: string;
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export function DashboardLayoutClient({
  children,
}: DashboardLayoutClientProps) {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { locale } = useLocale();

  useEffect(() => {
    async function fetchSystemConfig() {
      try {
        const response = await fetch(`/api/system-config?lang=${locale}`, {
          // cache: 'force-cache',
        });

        if (response.ok) {
          const result = await response.json();
          setSystemConfig(result.data);
        } else {
          setSystemConfig({
            defaultTitle: 'Anvel',
            appName: 'Avnel - Blog & Snippet',
            favicon: '/favicon.ico',
            textLogo: '/images/logo.png',
            textLogoDark: '/images/logo.png',
            logo: '/images/logo.png',
          });
        }
      } catch (error) {
        console.error('Error fetching system config:', error);
        setSystemConfig({
          defaultTitle: 'Anvel',
          appName: 'Avnel - Blog & Snippet',
          favicon: '/favicon.ico',
          textLogo: '/images/logo.png',
          textLogoDark: '/images/logo.png',
          logo: '/images/logo.png',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSystemConfig();
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop, setSidebarOpen]);

  useEffect(() => {
    if (systemConfig?.defaultTitle) {
      document.title = systemConfig.defaultTitle;
    }
  }, [systemConfig]);

  const header: DashboardHeaderProps = {
    systemConfig,
  };

  return (
    <div className="max-h-screen min-h-screen bg-[var(--color-background)]/20">
      <DashboardSidebar systemConfig={systemConfig} />

      <motion.div
        initial={false}
        animate={{
          marginLeft:
            isDesktop && isSidebarOpen ? '280px' : isDesktop ? '80px' : '0px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        <DashboardHeader {...header} />
        <div className="relative">{children}</div>
      </motion.div>
    </div>
  );
}
