'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Globe, Loader2 } from 'lucide-react';
import { i18n, LocaleProps } from '@/i18n/config';
import { useEffect, useState } from 'react';
import { useLocale } from '@/libs/hooks/use-locale';
import { useTranslations } from 'next-intl';
import { cn } from '@/libs/utils';

const localeLabels = {
  en: { label: 'English', flag: '🇺🇸' },
  vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme || 'system');
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="h-4 w-4" />;
    if (resolvedTheme === 'dark') return <Moon className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />;
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        cycleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleTheme]);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <div className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={cycleTheme}
          className="h-9 transition-colors hover:cursor-pointer"
        >
          {getThemeIcon()}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <span className="text-sm">Ctrl/Cmd + M</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function LocaleSelector() {
  const { locale, changeLocale, isChanging, isHydrated } = useLocale();
  const t = useTranslations('common');

  if (!isHydrated) {
    return (
      <>
        <Select disabled>
          <SelectTrigger className="h-9 w-auto min-w-[120px] md:hidden">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{t('loading')}...</span>
            </div>
          </SelectTrigger>
        </Select>
        <Button
          variant="outline"
          size="icon"
          disabled
          className="hidden h-9 md:flex"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </>
    );
  }

  return (
    <>
      <Select
        value={locale}
        onValueChange={value => changeLocale(value as LocaleProps)}
        disabled={isChanging}
      >
        <SelectTrigger className="h-9 w-auto min-w-[120px] hover:cursor-pointer md:hidden">
          <div className="flex items-center gap-2">
            {isChanging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="text-sm">
              {localeLabels[locale]?.flag} {localeLabels[locale]?.label}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {i18n.locales.map(localeOption => (
            <SelectItem key={localeOption} value={localeOption}>
              <div className="flex items-center gap-2 hover:cursor-pointer">
                <span>{localeLabels[localeOption]?.flag}</span>
                <span>{localeLabels[localeOption]?.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={locale}
        onValueChange={value => changeLocale(value as LocaleProps)}
        disabled={isChanging}
      >
        <SelectTrigger className="hidden h-9 w-9 p-0 hover:cursor-pointer md:flex [&>span]:hidden">
          <div className="flex items-center gap-2">
            {isChanging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="text-base">{localeLabels[locale]?.flag}</span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {i18n.locales.map(localeOption => (
            <SelectItem key={localeOption} value={localeOption}>
              <div className="flex items-center gap-2 hover:cursor-pointer">
                <span>{localeLabels[localeOption]?.flag}</span>
                <span>{localeLabels[localeOption]?.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export function ThemeLocaleControls({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LocaleSelector />
      <ThemeToggle />
    </div>
  );
}
