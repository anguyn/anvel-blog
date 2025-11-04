'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Replace,
  ReplaceAll,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';

interface FindReplaceProps {
  editor: Editor;
  onClose: () => void;
}

const findPluginKey = new PluginKey('findPlugin');

const createFindPlugin = (
  findText: string,
  caseSensitive: boolean,
  wholeWord: boolean,
  currentIndex: number,
) => {
  return new Plugin({
    key: findPluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, oldState, oldEditorState, newEditorState) {
        if (!findText) return DecorationSet.empty;

        const decorations: Decoration[] = [];
        const doc = newEditorState.doc;
        let matchCount = 0;

        doc.descendants((node, pos) => {
          if (!node.isText || !node.text) return;

          let nodeText = node.text;
          let searchText = findText;

          if (!caseSensitive) {
            nodeText = nodeText.toLowerCase();
            searchText = searchText.toLowerCase();
          }

          let index = 0;
          while (index < nodeText.length) {
            const matchIndex = nodeText.indexOf(searchText, index);
            if (matchIndex === -1) break;

            if (wholeWord) {
              const before = matchIndex > 0 ? nodeText[matchIndex - 1] : ' ';
              const after =
                matchIndex + searchText.length < nodeText.length
                  ? nodeText[matchIndex + searchText.length]
                  : ' ';

              if (!/\w/.test(before) && !/\w/.test(after)) {
                const from = pos + matchIndex;
                const to = from + findText.length;

                decorations.push(
                  Decoration.inline(from, to, {
                    class:
                      matchCount === currentIndex
                        ? 'find-match-current'
                        : 'find-match',
                    nodeName: 'span', // Force tạo span element
                  }),
                );
                matchCount++;
              }
            } else {
              const from = pos + matchIndex;
              const to = from + findText.length;

              decorations.push(
                Decoration.inline(from, to, {
                  class:
                    matchCount === currentIndex
                      ? 'find-match-current'
                      : 'find-match',
                  nodeName: 'span', // Force tạo span element
                }),
              );
              matchCount++;
            }

            index = matchIndex + 1;
          }
        });

        return DecorationSet.create(doc, decorations);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
};

export default function FindReplace({ editor, onClose }: FindReplaceProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [showReplace, setShowReplace] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout>(null);
  const matchesRef = useRef<number[]>([]);

  const debouncedFind = useMemo(
    () => (text: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!text) {
          matchesRef.current = [];
          setTotalMatches(0);
          setCurrentMatch(0);
          editor.unregisterPlugin(findPluginKey);
          return;
        }

        const matches = findMatches(text);
        matchesRef.current = matches;
        setTotalMatches(matches.length);

        if (matches.length > 0) {
          setCurrentMatch(1);
          const plugin = createFindPlugin(text, caseSensitive, wholeWord, 0);
          editor.unregisterPlugin(findPluginKey);
          editor.registerPlugin(plugin);
          scrollToMatch(matches[0]);
        } else {
          setCurrentMatch(0);
          editor.unregisterPlugin(findPluginKey);
        }
      }, 150);
    },
    [caseSensitive, wholeWord, editor],
  );

  useEffect(() => {
    debouncedFind(findText);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [findText, caseSensitive, wholeWord, debouncedFind]);

  useEffect(() => {
    if (findText && matchesRef.current.length > 0) {
      const plugin = createFindPlugin(
        findText,
        caseSensitive,
        wholeWord,
        currentMatch - 1,
      );
      editor.unregisterPlugin(findPluginKey);
      editor.registerPlugin(plugin);
    }
  }, [currentMatch, findText, caseSensitive, wholeWord, editor]);

  const findMatches = (text: string) => {
    if (!text) return [];

    const { state } = editor;
    const { doc } = state;
    let searchText = text;
    const matches: number[] = [];

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        let nodeText = node.text;

        if (!caseSensitive) {
          nodeText = nodeText.toLowerCase();
          searchText = searchText.toLowerCase();
        }

        let index = 0;
        while (index < nodeText.length) {
          const matchIndex = nodeText.indexOf(searchText, index);
          if (matchIndex === -1) break;

          if (wholeWord) {
            const before = matchIndex > 0 ? nodeText[matchIndex - 1] : ' ';
            const after =
              matchIndex + searchText.length < nodeText.length
                ? nodeText[matchIndex + searchText.length]
                : ' ';

            if (!/\w/.test(before) && !/\w/.test(after)) {
              matches.push(pos + matchIndex);
            }
          } else {
            matches.push(pos + matchIndex);
          }

          index = matchIndex + 1;
        }
      }
    });

    return matches;
  };

  const scrollToMatch = (position: number) => {
    if (position === undefined) return;

    try {
      editor.commands.setTextSelection({
        from: position,
        to: position + findText.length,
      });

      // Scroll vào view
      const { node } = editor.view.domAtPos(position);
      const element = node instanceof HTMLElement ? node : node.parentElement;

      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    } catch (error) {
      console.warn('Scroll failed:', error);
    }
  };

  const handleNext = () => {
    if (matchesRef.current.length === 0) return;

    const nextIndex = currentMatch % matchesRef.current.length;
    setCurrentMatch(nextIndex + 1);
    scrollToMatch(matchesRef.current[nextIndex]);
  };

  const handlePrevious = () => {
    if (matchesRef.current.length === 0) return;

    const prevIndex =
      (currentMatch - 2 + matchesRef.current.length) %
      matchesRef.current.length;
    setCurrentMatch(prevIndex + 1);
    scrollToMatch(matchesRef.current[prevIndex]);
  };

  const handleReplace = () => {
    if (!findText || matchesRef.current.length === 0 || currentMatch === 0)
      return;

    const currentPos = matchesRef.current[currentMatch - 1];

    editor
      .chain()
      .focus()
      .setTextSelection({ from: currentPos, to: currentPos + findText.length })
      .insertContent(replaceText)
      .run();

    // Re-find sau khi replace
    setTimeout(() => {
      const newMatches = findMatches(findText);
      matchesRef.current = newMatches;
      setTotalMatches(newMatches.length);

      if (newMatches.length > 0) {
        // Giữ nguyên index hoặc về đầu nếu hết
        const newIndex = Math.min(currentMatch, newMatches.length);
        setCurrentMatch(newIndex);
        scrollToMatch(newMatches[newIndex - 1]);
      } else {
        setCurrentMatch(0);
        editor.unregisterPlugin(findPluginKey);
      }
    }, 50);
  };

  const handleReplaceAll = () => {
    if (!findText || matchesRef.current.length === 0) return;

    // Replace từ cuối lên đầu để không ảnh hưởng vị trí
    const matches = [...matchesRef.current].reverse();

    editor.chain().focus().run();

    matches.forEach(pos => {
      editor
        .chain()
        .setTextSelection({ from: pos, to: pos + findText.length })
        .insertContent(replaceText)
        .run();
    });

    // Clear find
    matchesRef.current = [];
    setTotalMatches(0);
    setCurrentMatch(0);
    editor.unregisterPlugin(findPluginKey);
    setFindText('');
  };

  const handleClose = () => {
    editor.unregisterPlugin(findPluginKey);
    matchesRef.current = [];
    setFindText('');
    setTotalMatches(0);
    setCurrentMatch(0);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter from submitting form
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleReplace();
    }
  };

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-sm">
      <div className="flex items-center gap-2">
        {/* Find Input */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              value={findText}
              onChange={e => setFindText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find..."
              className="w-full rounded border border-[var(--color-input)] bg-[var(--color-background)] py-2 pr-3 pl-9 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              disabled={totalMatches === 0}
              className="rounded p-1.5 hover:bg-[var(--color-accent)] disabled:opacity-50"
              title="Previous"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={totalMatches === 0}
              className="rounded p-1.5 hover:bg-[var(--color-accent)] disabled:opacity-50"
              title="Next"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-[var(--color-muted-foreground)]">
              {totalMatches > 0 ? `${currentMatch}/${totalMatches}` : '0/0'}
            </span>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={e => setCaseSensitive(e.target.checked)}
                className="rounded"
              />
              Aa
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={e => setWholeWord(e.target.checked)}
                className="rounded"
              />
              Word
            </label>
          </div>

          {/* Toggle Replace */}
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={`rounded p-1.5 hover:bg-[var(--color-accent)] ${showReplace ? 'bg-[var(--color-accent)]' : ''}`}
            title="Toggle Replace"
          >
            <Replace className="h-4 w-4" />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className="rounded p-1.5 hover:bg-[var(--color-accent)]"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Replace Row */}
      {showReplace && (
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
              placeholder="Replace with..."
              className="w-full rounded border border-[var(--color-input)] bg-[var(--color-background)] py-2 pr-3 pl-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <button
            onClick={handleReplace}
            disabled={totalMatches === 0}
            className="flex items-center gap-1 rounded bg-[var(--color-secondary)] px-3 py-2 text-xs hover:bg-[var(--color-accent)] disabled:opacity-50"
            title="Replace"
          >
            <Replace className="h-3 w-3" />
            Replace
          </button>

          <button
            onClick={handleReplaceAll}
            disabled={totalMatches === 0}
            className="flex items-center gap-1 rounded bg-[var(--color-secondary)] px-3 py-2 text-xs hover:bg-[var(--color-accent)] disabled:opacity-50"
            title="Replace All"
          >
            <ReplaceAll className="h-3 w-3" />
            All
          </button>
        </div>
      )}
    </div>
  );
}
