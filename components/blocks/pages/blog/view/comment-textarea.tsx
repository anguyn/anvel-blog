'use client';

import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { cn } from '@/libs/utils';

interface CommentTextareaProps {
  value: string;
  onChange: (value: string, cursorPos: number) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  minHeight?: number;
  maxHeightPercent?: number;
  mentions?: Array<{
    id: string;
    userId: string;
    username: string;
    position: number;
  }>;
}

export interface CommentTextareaRef {
  focus: () => void;
  blur: () => void;
  getSelectionStart: () => number;
  setSelectionRange: (start: number, end: number) => void;
}

export const CommentTextarea = forwardRef<
  CommentTextareaRef,
  CommentTextareaProps
>(
  (
    {
      value,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      placeholder,
      disabled,
      className,
      autoFocus,
      minHeight = 60,
      maxHeightPercent = 40,
      mentions = [],
      ...props
    },
    ref,
  ) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const isComposingRef = useRef(false);
    const lastValueRef = useRef(value);
    const isUpdatingRef = useRef(false);

    useImperativeHandle(ref, () => ({
      focus: () => editableRef.current?.focus(),
      blur: () => editableRef.current?.blur(),
      getSelectionStart: () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return 0;

        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editableRef.current!);
        preCaretRange.setEnd(range.endContainer, range.endOffset);

        return preCaretRange.toString().length;
      },
      setSelectionRange: (start: number, end: number) => {
        const el = editableRef.current;
        if (!el) return;

        const range = document.createRange();
        const sel = window.getSelection();

        let charIndex = 0;
        const nodeStack: Node[] = [el];
        let node: Node | undefined;
        let foundStart = false;
        let stop = false;

        while (!stop && (node = nodeStack.pop())) {
          if (node.nodeType === 3) {
            const nextCharIndex = charIndex + (node.textContent?.length || 0);
            if (!foundStart && start >= charIndex && start <= nextCharIndex) {
              range.setStart(node, start - charIndex);
              foundStart = true;
            }
            if (foundStart && end >= charIndex && end <= nextCharIndex) {
              range.setEnd(node, end - charIndex);
              stop = true;
            }
            charIndex = nextCharIndex;
          } else {
            let i = node.childNodes.length;
            while (i--) {
              nodeStack.push(node.childNodes[i]);
            }
          }
        }

        sel?.removeAllRanges();
        sel?.addRange(range);
      },
    }));

    const textToHtml = useCallback(
      (
        text: string,
        mentionsList: Array<{
          id: string;
          userId: string;
          username: string;
          position: number;
        }>,
      ) => {
        if (!mentionsList || mentionsList.length === 0) {
          return text.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
        }

        const parts: string[] = [];
        let lastIndex = 0;

        const sortedMentions = [...mentionsList].sort(
          (a, b) => a.position - b.position,
        );

        sortedMentions.forEach(mention => {
          if (mention.position > lastIndex) {
            const beforeText = text.slice(lastIndex, mention.position);
            parts.push(
              beforeText.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;'),
            );
          }

          const mentionText = `@${mention.username}`;
          parts.push(
            `<span class="mention" data-user-id="${mention.userId}" data-mention-id="${mention.id}" contenteditable="false" style="display: inline-block; background-color: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); padding: 2px 6px; border-radius: 4px; font-weight: 600; margin: 0 1px;">${mentionText}</span>`,
          );

          lastIndex = mention.position + mentionText.length;
        });

        if (lastIndex < text.length) {
          const remainingText = text.slice(lastIndex);
          parts.push(
            remainingText.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;'),
          );
        }

        return parts.join('');
      },
      [],
    );

    const htmlToText = useCallback((html: string): string => {
      const temp = document.createElement('div');
      temp.innerHTML = html;

      temp.querySelectorAll('.mention').forEach(span => {
        const textNode = document.createTextNode(span.textContent || '');
        span.parentNode?.replaceChild(textNode, span);
      });

      return temp.textContent || '';
    }, []);

    useEffect(() => {
      const el = editableRef.current;
      if (!el || document.activeElement === el || isUpdatingRef.current) return;

      isUpdatingRef.current = true;
      const cursorPos =
        ref && 'current' in ref && ref.current
          ? ref.current.getSelectionStart()
          : 0;

      const html = textToHtml(value, mentions);
      if (el.innerHTML !== html) {
        el.innerHTML = html;
        lastValueRef.current = value;

        // Restore cursor position
        setTimeout(() => {
          if (ref && 'current' in ref && ref.current && cursorPos > 0) {
            ref.current.setSelectionRange(cursorPos, cursorPos);
          }
        }, 0);
      }
      isUpdatingRef.current = false;
    }, [value, mentions, textToHtml, ref]);

    useEffect(() => {
      const el = editableRef.current;
      if (!el) return;

      const maxHeight = (window.innerHeight * maxHeightPercent) / 100;

      el.style.height = 'auto';
      const scrollHeight = el.scrollHeight;

      if (scrollHeight < minHeight) {
        el.style.height = `${minHeight}px`;
        el.style.overflowY = 'hidden';
      } else if (scrollHeight > maxHeight) {
        el.style.height = `${maxHeight}px`;
        el.style.overflowY = 'auto';
      } else {
        el.style.height = `${scrollHeight}px`;
        el.style.overflowY = 'hidden';
      }
    }, [value, minHeight, maxHeightPercent]);

    const handleInput = useCallback(() => {
      if (isComposingRef.current || isUpdatingRef.current) return;

      const el = editableRef.current;
      if (!el) return;

      const text = htmlToText(el.innerHTML);
      const cursorPos =
        ref && 'current' in ref && ref.current
          ? ref.current.getSelectionStart()
          : 0;

      if (text !== lastValueRef.current) {
        lastValueRef.current = text;
        onChange(text, cursorPos);
      }
    }, [onChange, htmlToText, ref]);

    const handlePaste = useCallback(
      (e: React.ClipboardEvent) => {
        e.preventDefault();

        const text = e.clipboardData.getData('text/plain');
        const sel = window.getSelection();

        if (sel && sel.rangeCount > 0) {
          sel.deleteFromDocument();
          const textNode = document.createTextNode(text);
          sel.getRangeAt(0).insertNode(textNode);

          const range = document.createRange();
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);

          handleInput();
        }
      },
      [handleInput],
    );

    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(() => {
      isComposingRef.current = false;
      handleInput();
    }, [handleInput]);

    useEffect(() => {
      if (autoFocus && editableRef.current) {
        editableRef.current.focus();
      }
    }, [autoFocus]);

    return (
      <div
        ref={editableRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onPaste={handlePaste}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        suppressContentEditableWarning
        className={cn(
          'relative w-full resize-none break-words whitespace-pre-wrap transition-all outline-none',
          disabled && 'cursor-not-allowed opacity-50',
          !value &&
            'empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
          className,
        )}
        style={{
          minHeight: `${minHeight}px`,
        }}
        data-placeholder={placeholder}
        role="textbox"
        aria-multiline="true"
        {...props}
      />
    );
  },
);

CommentTextarea.displayName = 'CommentTextarea';
