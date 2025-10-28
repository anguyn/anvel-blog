'use client';

import { useLocale } from '@/libs/hooks/use-locale';

export default function LocaleFooter() {
  const { changeLocale, isChanging } = useLocale();
  const localeLabels = {
    en: { label: 'English', flag: '🇺🇸' },
    vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
  };

  return (
    <div className="flex items-center gap-4">
      <button
        disabled={isChanging}
        onClick={() => changeLocale('en')}
        className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:cursor-pointer hover:text-[var(--color-foreground)]"
      >
        {localeLabels.en?.flag} {localeLabels.en?.label}
      </button>
      <span className="text-[var(--color-muted-foreground)]">|</span>
      <button
        disabled={isChanging}
        onClick={() => changeLocale('vi')}
        className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:cursor-pointer hover:text-[var(--color-foreground)]"
      >
        {localeLabels.vi?.flag} {localeLabels.vi?.label}
      </button>
    </div>
  );
}
