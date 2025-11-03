'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Replace,
  ReplaceAll,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface FindReplaceProps {
  editor: Editor;
  onClose: () => void;
}

export default function FindReplace({ editor, onClose }: FindReplaceProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [showReplace, setShowReplace] = useState(false);

  useEffect(() => {
    if (!findText) {
      clearHighlights();
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }

    const matches = findMatches();
    setTotalMatches(matches.length);
    if (matches.length > 0) {
      setCurrentMatch(1);
      highlightMatches(matches, 0);
    }
  }, [findText, caseSensitive, wholeWord]);

  const findMatches = () => {
    const content = editor.getText();
    let searchText = findText;
    let text = content;

    if (!caseSensitive) {
      searchText = searchText.toLowerCase();
      text = text.toLowerCase();
    }

    const matches: number[] = [];
    let index = 0;

    while (index < text.length) {
      const matchIndex = text.indexOf(searchText, index);
      if (matchIndex === -1) break;

      if (wholeWord) {
        const before = matchIndex > 0 ? text[matchIndex - 1] : ' ';
        const after =
          matchIndex + searchText.length < text.length
            ? text[matchIndex + searchText.length]
            : ' ';

        if (!/\w/.test(before) && !/\w/.test(after)) {
          matches.push(matchIndex);
        }
      } else {
        matches.push(matchIndex);
      }

      index = matchIndex + 1;
    }

    return matches;
  };

  const highlightMatches = (matches: number[], currentIndex: number) => {
    clearHighlights();

    matches.forEach((matchPos, idx) => {
      const from = matchPos;
      const to = matchPos + findText.length;

      editor
        .chain()
        .setTextSelection({ from, to })
        .setHighlight({
          color: idx === currentIndex ? '#fbbf24' : '#fef08a',
        })
        .run();
    });

    // Scroll to current match
    if (matches.length > 0) {
      const currentPos = matches[currentIndex];
      editor
        .chain()
        .setTextSelection({
          from: currentPos,
          to: currentPos + findText.length,
        })
        .run();

      // Scroll into view
      try {
        const { node } = editor.view.domAtPos(currentPos);
        const element =
          node.nodeType === Node.ELEMENT_NODE
            ? (node as HTMLElement)
            : (node.parentElement as HTMLElement);

        if (element && element.scrollIntoView) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      } catch (error) {
        console.error('Scroll error:', error);
      }
    }
  };

  const clearHighlights = () => {
    editor.chain().focus().unsetHighlight().run();
  };

  const handleNext = () => {
    const matches = findMatches();
    if (matches.length === 0) return;

    const nextIndex = currentMatch % matches.length;
    setCurrentMatch(nextIndex + 1);
    highlightMatches(matches, nextIndex);
  };

  const handlePrevious = () => {
    const matches = findMatches();
    if (matches.length === 0) return;

    const prevIndex = (currentMatch - 2 + matches.length) % matches.length;
    setCurrentMatch(prevIndex + 1);
    highlightMatches(matches, prevIndex);
  };

  const handleReplace = () => {
    if (!findText) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    const matches = caseSensitive
      ? selectedText === findText
      : selectedText.toLowerCase() === findText.toLowerCase();

    if (matches) {
      editor.chain().focus().insertContentAt({ from, to }, replaceText).run();
      handleNext();
    } else {
      handleNext();
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;

    const content = editor.getText();
    let newContent = content;

    if (caseSensitive) {
      newContent = content.split(findText).join(replaceText);
    } else {
      const regex = new RegExp(
        findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'gi',
      );
      newContent = content.replace(regex, replaceText);
    }

    editor.commands.setContent(newContent);
    clearHighlights();
    setTotalMatches(0);
    setCurrentMatch(0);
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
            onClick={() => {
              clearHighlights();
              onClose();
            }}
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
