'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';

// Import components
import EditorToolbar from './tiptap-editor/editor-toolbar';
import TableToolbar from './tiptap-editor/table-toolbar';
import FindReplace from './tiptap-editor/find-replace';
import BubbleMenu from './tiptap-editor/bubble-menu';

// Import extensions
import {
  FontSize,
  LineHeight,
  ResizableImage,
} from './tiptap-editor/editor-extensions';

// Import styles
// import './editor-styles.css';

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (content: string) => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
}

export default function TiptapEditor({
  value,
  onChange,
  onSave,
  autoSave = false,
  autoSaveInterval = 5000,
  placeholder = 'Start writing...',
  minHeight = '500px',
  maxHeight = '70vh',
}: TiptapEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const lastSavedContent = useRef(value);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Debounced onChange to prevent excessive updates
  const debouncedOnChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (html: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onChange(html);
      }, 300);
    };
  }, [onChange]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onSave) return;

    const interval = setInterval(() => {
      const currentContent = editor?.getHTML() || '';
      if (currentContent !== lastSavedContent.current && !isSaving) {
        setIsSaving(true);
        onSave(currentContent);
        lastSavedContent.current = currentContent;

        // Reset saving state after 1 second
        setTimeout(() => setIsSaving(false), 1000);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, onSave, isSaving]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize,
      LineHeight,
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
        languageClassPrefix: 'language-',
        defaultLanguage: 'plaintext',
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedOnChange(html);
    },
    editorProps: {
      attributes: {
        class: 'editor-content focus:outline-none',
        spellcheck: 'false',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleManualSave = () => {
    if (onSave && !isSaving) {
      const content = editor?.getHTML() || '';
      setIsSaving(true);
      onSave(content);
      lastSavedContent.current = content;

      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  if (!editor) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Loading editor...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Main Toolbar */}
      <EditorToolbar
        editor={editor}
        onSave={onSave ? handleManualSave : undefined}
        isSaving={isSaving}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        showScrollbar={showScrollbar}
        onToggleScrollbar={() => setShowScrollbar(!showScrollbar)}
        onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
      />

      {/* Find & Replace */}
      {showFindReplace && (
        <FindReplace
          editor={editor}
          onClose={() => setShowFindReplace(false)}
        />
      )}

      {/* Table Toolbar */}
      {editor.isActive('table') && <TableToolbar editor={editor} />}

      {/* Bubble Menu */}
      <BubbleMenu editor={editor} />

      {/* Editor Content */}
      <div
        className={`${
          showScrollbar ? 'overflow-y-auto' : 'scrollbar-hidden overflow-y-auto'
        } ${isFullscreen ? 'h-[calc(100vh-120px)]' : ''}`}
        style={{
          minHeight: isFullscreen ? 'auto' : minHeight,
          maxHeight: isFullscreen ? 'calc(100vh - 120px)' : maxHeight,
        }}
      >
        <div className="px-6">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Status Bar */}
      {(autoSave || onSave) && (
        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-2 text-xs text-[var(--color-muted-foreground)]">
          <div>
            {editor.storage.characterCount?.characters() || 0} characters
          </div>
          {isSaving && (
            <div className="text-[var(--color-primary)]">Saving...</div>
          )}
        </div>
      )}
    </div>
  );
}
