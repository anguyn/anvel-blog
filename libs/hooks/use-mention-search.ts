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
      // Require minimum 2 characters
      if (!query || query.length < 2) {
        setMentionUsers([]);
        setIsSearching(false);
        return;
      }

      // Abort previous request
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }

      searchAbortController.current = new AbortController();
      setIsSearching(true);

      try {
        const res = await fetch(
          `/api/posts/${postId}/mention-search?q=${encodeURIComponent(query)}`,
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
    }, 300), // 300ms debounce
    [postId],
  );

  // Handle input for mentions
  const handleMentionInput = useCallback(
    (value: string, cursorPos: number) => {
      // Find @ symbol before cursor
      const beforeCursor = value.slice(0, cursorPos);
      const lastAtIndex = beforeCursor.lastIndexOf('@');

      if (lastAtIndex === -1) {
        setShowMentions(false);
        setMentionStartPos(null);
        setMentionUsers([]);
        return;
      }

      // Get text after @
      const afterAt = beforeCursor.slice(lastAtIndex + 1);

      // Check if there's a space after @ (invalid mention)
      if (afterAt.includes(' ')) {
        setShowMentions(false);
        setMentionStartPos(null);
        setMentionUsers([]);
        return;
      }

      // Check if @ is at start or has space before it
      const charBeforeAt =
        lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt !== ' ' && lastAtIndex !== 0) {
        setShowMentions(false);
        setMentionStartPos(null);
        return;
      }

      // Valid mention in progress
      setShowMentions(true);
      setMentionStartPos(lastAtIndex);
      setMentionSearch(afterAt);

      // Only search if we have at least 2 characters
      if (afterAt.length >= 2) {
        searchUsers(afterAt);
      } else if (afterAt.length === 0) {
        // Show empty state or recent commenters
        setMentionUsers([]);
      }
    },
    [searchUsers],
  );

  // Select mention from list
  const selectMention = useCallback(
    (user: MentionUser, textarea: HTMLTextAreaElement | null) => {
      if (!textarea || mentionStartPos === null) return;

      const value = textarea.value;
      const beforeMention = value.slice(0, mentionStartPos);
      const afterMention = value.slice(textarea.selectionStart);

      const newValue = `${beforeMention}@${user.username} ${afterMention}`;
      const newCursorPos = mentionStartPos + user.username.length + 2;

      // Update textarea value
      textarea.value = newValue;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();

      // Trigger change event for React
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

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
