'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/common/input';
import { Badge } from '@/components/common/badge';
import { cn } from '@/libs/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  validate?: (tag: string) => boolean | string;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Type and press Enter...',
  validate,
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim();

    if (!trimmed) return;

    if (value.includes(trimmed)) {
      setError('Already added');
      return;
    }

    if (validate) {
      const result = validate(trimmed);
      if (result !== true) {
        setError(typeof result === 'string' ? result : 'Invalid input');
        return;
      }
    }

    onChange([...value, trimmed]);
    setInputValue('');
    setError(null);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-2', className)}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="gap-1 py-1 pr-1 pl-2"
            >
              <span className="text-sm">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(index)}
                disabled={disabled}
                className="hover:bg-accent ml-1 rounded-full p-0.5 transition-colors disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <Input
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={placeholder}
          disabled={disabled}
          className={error ? 'border-destructive' : ''}
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      <p className="text-muted-foreground text-xs">
        Press Enter or comma to add. Backspace to remove last.
      </p>
    </div>
  );
}
