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

  const searchAbortController = useRef<AbortController | null>(null);

  // Search users for mention with debounce
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

  // Handle input for mentions
  const handleMentionInput = useCallback(
    (value: string, cursorPos: number) => {
      const beforeCursor = value.slice(0, cursorPos);
      const lastAtIndex = beforeCursor.lastIndexOf('@');

      if (lastAtIndex === -1) {
        setShowMentions(false);
        setMentionStartPos(null);
        setMentionUsers([]);
        return;
      }

      const afterAt = beforeCursor.slice(lastAtIndex + 1);

      if (afterAt.includes(' ')) {
        setShowMentions(false);
        setMentionStartPos(null);
        setMentionUsers([]);
        return;
      }

      const charBeforeAt =
        lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt !== ' ' && lastAtIndex !== 0) {
        setShowMentions(false);
        setMentionStartPos(null);
        return;
      }

      setShowMentions(true);
      setMentionStartPos(lastAtIndex);
      setMentionSearch(afterAt);

      if (afterAt.length >= 2) {
        searchUsers(afterAt);
      } else if (afterAt.length === 0) {
        setMentionUsers([]);
      }
    },
    [searchUsers],
  );

  // Select mention from list - Fixed version
  const selectMention = useCallback(
    (user: MentionUser, textarea: HTMLTextAreaElement | null) => {
      if (!textarea || mentionStartPos === null) return;

      const value = textarea.value;
      const beforeMention = value.slice(0, mentionStartPos);
      const afterCursor = value.slice(textarea.selectionStart);

      const newValue = `${beforeMention}@${user.username} ${afterCursor}`;
      const newCursorPos = mentionStartPos + user.username.length + 2;

      // Update via React's controlled component pattern
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value',
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textarea, newValue);
      } else {
        textarea.value = newValue;
      }

      // Trigger React onChange
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);

      // Set cursor position
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);

      // Close mentions
      closeMentions();
    },
    [mentionStartPos],
  );

  // Handle keyboard navigation in mention list
  const handleMentionKeyDown = useCallback(
    (e: KeyboardEvent, textarea: HTMLTextAreaElement) => {
      if (!showMentions || mentionUsers.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedMentionIndex(prev =>
            prev < mentionUsers.length - 1 ? prev + 1 : 0,
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedMentionIndex(prev =>
            prev > 0 ? prev - 1 : mentionUsers.length - 1,
          );
          break;

        case 'Enter':
        case 'Tab':
          if (mentionUsers.length > 0) {
            e.preventDefault();
            selectMention(mentionUsers[selectedMentionIndex], textarea);
          }
          break;

        case 'Escape':
          e.preventDefault();
          closeMentions();
          break;
      }
    },
    [showMentions, mentionUsers, selectedMentionIndex, selectMention],
  );

  // Close mentions
  const closeMentions = useCallback(() => {
    setShowMentions(false);
    setMentionStartPos(null);
    setMentionSearch('');
    setMentionUsers([]);
    setIsSearching(false);
  }, []);

  // Cleanup on unmount
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
    isSearching,
    handleMentionInput,
    handleMentionKeyDown,
    selectMention,
    closeMentions,
  };
}
