'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { SearchResultsList, type SearchResult } from './search-results';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function SearchModal({ isOpen, onClose, locale }: SearchModalProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      // const data = await response.json();

      // Mock data for now
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'snippet',
          title: 'React Custom Hook for Data Fetching',
          language: 'TypeScript',
          author: 'john_doe',
        },
        {
          id: '2',
          type: 'blog',
          title: 'Introduction to Framer Motion',
          excerpt: 'Learn the basics of animation...',
          author: 'jane_smith',
        },
        {
          id: '3',
          type: 'user',
          title: 'User',
          name: 'John Doe',
          username: 'john_doe',
        },
      ];

      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] hidden bg-black/50 backdrop-blur-sm lg:block"
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 left-1/2 z-[61] hidden w-full max-w-2xl -translate-x-1/2 lg:block"
          >
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl">
              {/* Search Input */}
              <form onSubmit={handleSearchSubmit}>
                <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
                  <Search className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-lg text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)]"
                  />
                  {isSearching && (
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
                  )}
                </div>
              </form>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {searchQuery && searchResults ? (
                  <SearchResultsList
                    results={searchResults}
                    locale={locale}
                    searchQuery={searchQuery}
                    onClose={onClose}
                  />
                ) : !searchQuery ? (
                  <div className="p-8 text-center text-[var(--color-muted-foreground)]">
                    <Search className="mx-auto mb-3 h-12 w-12 opacity-50" />
                    <p>{t('search.startTyping')}</p>
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-muted-foreground)]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-secondary)] px-1.5 py-0.5">
                      ↑
                    </kbd>
                    <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-secondary)] px-1.5 py-0.5">
                      ↓
                    </kbd>
                    {t('search.toNavigate')}
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-secondary)] px-1.5 py-0.5">
                    ESC
                  </kbd>
                  {t('search.toClose')}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
