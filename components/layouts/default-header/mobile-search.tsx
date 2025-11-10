'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { SearchResultItem, type SearchResult } from './search-results';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function MobileSearch({ isOpen, onClose, locale }: MobileSearchProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[110] bg-[var(--color-background)] lg:hidden"
        >
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-1 items-center gap-3"
            >
              <Search className="h-5 w-5 text-[var(--color-muted-foreground)]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('search.search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)]"
              />
              {isSearching && (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
              )}
            </form>
          </div>

          <div className="h-[calc(100vh-73px)] overflow-y-auto p-4">
            {searchQuery && searchResults ? (
              <div className="space-y-2">
                {searchResults.map(result => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <SearchResultItem
                      result={result}
                      locale={locale}
                      onClose={onClose}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[var(--color-muted-foreground)]">
                <Search className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>{t('search.startTyping')}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
