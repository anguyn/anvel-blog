import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from '@/libs//utils';

interface MentionUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
}

export function useMentionSearch(postId: string) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const searchAbortController = useRef<AbortController | null>(null);

  const searchUsers = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setMentionUsers([]);
        setIsSearching(false);
        return;
      }

      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }

      searchAbortController.current = new AbortController();
      setIsSearching(true);

      try {
        const res = await fetch(
          `/api/posts/${postId}/commenters?q=${encodeURIComponent(query)}`,
          { signal: searchAbortController.current.signal },
        );

        if (res.ok) {
          const data = await res.json();
          setMentionUsers(data.users || []);
          setSelectedMentionIndex(0);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error searching users:', error);
          setMentionUsers([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [postId],
  );

  const handleMentionInput = useCallback(
    (value: string, cursorPos: number, element: HTMLElement | null) => {
      const beforeCursor = value.slice(0, cursorPos);
      const lastAtIndex = beforeCursor.lastIndexOf('@');

      if (lastAtIndex === -1) {
        setShowMentions(false);
        setMentionStartPos(null);
        setMentionUsers([]);
        setAnchorEl(null);
        return;
      }

      const afterAt = beforeCursor.slice(lastAtIndex + 1);

      if (afterAt.includes(' ')) {
        setShowMentions(false);
        setMentionStartPos(null);
        setMentionUsers([]);
        setAnchorEl(null);
        return;
      }

      const charBeforeAt =
        lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt !== ' ' && charBeforeAt !== '\n' && lastAtIndex !== 0) {
        setShowMentions(false);
        setMentionStartPos(null);
        setAnchorEl(null);
        return;
      }

      setShowMentions(true);
      setMentionStartPos(lastAtIndex);
      setMentionSearch(afterAt);

      if (element) {
        setAnchorEl(element);
      }

      if (afterAt.length >= 2) {
        searchUsers(afterAt);
      } else if (afterAt.length === 0) {
        setMentionUsers([]);
      }
    },
    [searchUsers],
  );

  const handleMentionKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!showMentions || mentionUsers.length === 0) return false;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedMentionIndex(prev =>
            prev < mentionUsers.length - 1 ? prev + 1 : 0,
          );
          return true;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedMentionIndex(prev =>
            prev > 0 ? prev - 1 : mentionUsers.length - 1,
          );
          return true;

        case 'Enter':
        case 'Tab':
          if (mentionUsers.length > 0) {
            e.preventDefault();
            return mentionUsers[selectedMentionIndex];
          }
          break;

        case 'Escape':
          e.preventDefault();
          closeMentions();
          return true;
      }

      return false;
    },
    [showMentions, mentionUsers, selectedMentionIndex],
  );

  const closeMentions = useCallback(() => {
    setShowMentions(false);
    setMentionStartPos(null);
    setMentionSearch('');
    setMentionUsers([]);
    setIsSearching(false);
    setAnchorEl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
    };
  }, []);

  return {
    showMentions,
    mentionSearch,
    mentionUsers,
    selectedMentionIndex,
    mentionStartPos,
    isSearching,
    anchorEl,
    handleMentionInput,
    handleMentionKeyDown,
    closeMentions,
  };
}
