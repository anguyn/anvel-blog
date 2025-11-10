'use client';

import { memo, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { Plus, Trash2, Palette } from 'lucide-react';
import { useState } from 'react';

interface TableToolbarProps {
  editor: Editor;
  onClose: () => void;
}

function TableToolbar({ editor, onClose }: TableToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [cellColor, setCellColor] = useState('#ffffff');

  useEffect(() => {
    const checkTableActive = () => {
      if (!editor.isActive('table')) {
        onClose();
      }
    };

    editor.on('update', checkTableActive);
    editor.on('selectionUpdate', checkTableActive);

    return () => {
      editor.off('update', checkTableActive);
      editor.off('selectionUpdate', checkTableActive);
    };
  }, [editor, onClose]);

  const setCellBackgroundColor = (color: string) => {
    editor.chain().focus().setCellAttribute('backgroundColor', color).run();
    setShowColorPicker(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[var(--color-border)] bg-[var(--color-muted)] p-2">
      <button
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[var(--color-accent)]"
      >
        <Plus className="h-3 w-3" />
        Col Before
      </button>
      <button
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[var(--color-accent)]"
      >
        <Plus className="h-3 w-3" />
        Col After
      </button>
      <button
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[var(--color-accent)]"
      >
        <Trash2 className="h-3 w-3" />
        Del Col
      </button>

      <div className="h-6 w-px bg-[var(--color-border)]" />

      <button
        onClick={() => editor.chain().focus().addRowBefore().run()}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[var(--color-accent)]"
      >
        <Plus className="h-3 w-3" />
        Row Before
      </button>
      <button
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[var(--color-accent)]"
      >
        <Plus className="h-3 w-3" />
        Row After
      </button>
      <button
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[var(--color-accent)]"
      >
        <Trash2 className="h-3 w-3" />
        Del Row
      </button>

      <div className="h-6 w-px bg-[var(--color-border)]" />

      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[var(--color-accent)]"
        >
          <Palette className="h-3 w-3" />
          Cell Color
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 z-20 mt-1 rounded border border-[var(--color-border)] bg-[var(--color-background)] p-2 shadow-lg">
            <input
              type="color"
              value={cellColor}
              onChange={e => {
                setCellColor(e.target.value);
                setCellBackgroundColor(e.target.value);
              }}
              className="h-8 w-32"
            />
            <button
              onClick={() => {
                setCellBackgroundColor('transparent');
                setShowColorPicker(false);
              }}
              className="mt-2 w-full rounded bg-[var(--color-secondary)] px-2 py-1 text-xs hover:bg-[var(--color-accent)]"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="h-6 w-px bg-[var(--color-border)]" />

      <button
        onClick={() => editor.chain().focus().mergeCells().run()}
        disabled={!editor.can().mergeCells()}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[var(--color-accent)] disabled:opacity-50"
      >
        Merge Cells
      </button>
      <button
        onClick={() => editor.chain().focus().splitCell().run()}
        disabled={!editor.can().splitCell()}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-[var(--color-accent)] disabled:opacity-50"
      >
        Split Cell
      </button>

      <div className="h-6 w-px bg-[var(--color-border)]" />

      <button
        onClick={() => {
          editor.chain().focus().deleteTable().run();
          onClose();
        }}
        className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
      >
        <Trash2 className="h-3 w-3" />
        Delete Table
      </button>
    </div>
  );
}

export default memo(TableToolbar);
