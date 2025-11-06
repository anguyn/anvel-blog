// Tạo file mới: components/blog/optimized-textarea.tsx
'use client';

import { memo, useCallback } from 'react';

interface CommentTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
}

export const CommentTextarea = memo(
  ({
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    textareaRef,
    placeholder,
    disabled,
    rows,
    className,
    autoFocus,
  }: CommentTextareaProps) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      },
      [onChange],
    );

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={className}
        autoFocus={autoFocus}
      />
    );
  },
);

CommentTextarea.displayName = 'CommentTextarea';
