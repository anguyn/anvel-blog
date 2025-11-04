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
import Gapcursor from '@tiptap/extension-gapcursor';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';

// Import components
import EditorToolbar from './tiptap-editor/editor-toolbar';
import TableToolbar from './tiptap-editor/table-toolbar';
import FindReplace from './tiptap-editor/find-replace';
import BubbleMenu from './tiptap-editor/bubble-menu';
import ImageBubbleMenu from './tiptap-editor/image-bubble-menu';
import DrawTool from './tiptap-editor/draw-tool';

// Import extensions
import {
  HtmlView,
  FontSize,
  LineHeight,
  ResizableImage,
  IndentExtension,
  DrawToolExtension,
  EmbedMedia,
  configureMention,
} from './tiptap-editor/editor-extensions';

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
  const [showHtml, setShowHtml] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTableToolbar, setShowTableToolbar] = useState(false);
  const [showDrawTool, setShowDrawTool] = useState(false);

  const lastSavedContent = useRef(value);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const mentionUsers = useMemo(
    () => [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
      { id: '3', name: 'Alice Johnson' },
      { id: '4', name: 'Bob Williams' },
      { id: '5', name: 'Charlie Brown' },
    ],
    [],
  );

  // Debounced onChange to prevent excessive updates
  const debouncedOnChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    const isInDialog = false;

    return (html: string, skipSave = false) => {
      if (skipSave || isInDialog) return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onChange(html);
      }, 300);
    };
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        gapcursor: false, // Disable default, use extension below
      }),
      HtmlView,
      Gapcursor,
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
      IndentExtension,
      DrawToolExtension,
      // configureMention(mentionUsers),
      EmbedMedia,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedOnChange(html);

      // Update table toolbar instantly
      setShowTableToolbar(editor.isActive('table'));
    },
    editorProps: {
      attributes: {
        class: 'editor-content focus:outline-none',
        spellcheck: 'false',
      },
      handleKeyDown: (view, event) => {
        // Custom hotkeys
        const isMod = event.ctrlKey || event.metaKey;

        // Indent with Tab (in lists)
        if (event.key === 'Tab' && !event.shiftKey) {
          if (editor?.isActive('listItem')) {
            event.preventDefault();
            editor.chain().focus().sinkListItem('listItem').run();
            return true;
          }
          // Regular indent for paragraphs
          event.preventDefault();
          editor
            ?.chain()
            .focus()
            .command(({ tr }) => {
              const { selection } = tr;
              const { $from } = selection;
              const node = $from.parent;

              if (node.type.name === 'paragraph') {
                // Add margin-left
                tr.setNodeMarkup($from.before(), null, {
                  ...node.attrs,
                  style: `margin-left: ${parseInt(node.attrs.style?.match(/margin-left:\s*(\d+)px/)?.[1] || '0') + 30}px`,
                });
              }
              return true;
            })
            .run();
          return true;
        }

        // Outdent with Shift+Tab
        if (event.key === 'Tab' && event.shiftKey) {
          if (editor?.isActive('listItem')) {
            event.preventDefault();
            editor.chain().focus().liftListItem('listItem').run();
            return true;
          }
          // Regular outdent for paragraphs
          event.preventDefault();
          editor
            ?.chain()
            .focus()
            .command(({ tr }) => {
              const { selection } = tr;
              const { $from } = selection;
              const node = $from.parent;

              if (node.type.name === 'paragraph') {
                const currentMargin = parseInt(
                  node.attrs.style?.match(/margin-left:\s*(\d+)px/)?.[1] || '0',
                );
                const newMargin = Math.max(0, currentMargin - 30);
                tr.setNodeMarkup($from.before(), null, {
                  ...node.attrs,
                  style:
                    newMargin > 0 ? `margin-left: ${newMargin}px` : undefined,
                });
              }
              return true;
            })
            .run();
          return true;
        }

        // Find & Replace (Ctrl+F)
        if (isMod && event.key === 'f') {
          event.preventDefault();
          setShowFindReplace(true);
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    if (!autoSave || !onSave) return;

    // console.log("Dô dây: ", onSave)
    // return;

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
  }, [autoSave, autoSaveInterval, onSave, isSaving, editor]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && onSave) {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onSave]);

  const handleManualSave = () => {
    if (onSave && !isSaving) {
      const content = editor?.getHTML() || '';
      setIsSaving(true);
      onSave(content);
      lastSavedContent.current = content;

      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const handleInsertEmbed = () => {
    const url = prompt('Enter YouTube/Vimeo/Twitter/CodePen/CodeSandbox URL:');
    if (url && editor) {
      editor.commands.insertEmbed(url);
    }
  };

  const handleDrawToolInsert = (dataUrl: string) => {
    if (editor) {
      editor.commands.insertDrawing(dataUrl);
    }
  };

  const toggleHtml = () => {
    setShowHtml(!showHtml);
  };

  const exportToWord = () => {
    if (!editor) return;

    const content = editor.getHTML();

    // Create a simple Word document structure
    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Export</title></head>
      <body>${content}</body>
      </html>
    `;

    const blob = new Blob([docContent], {
      type: 'application/vnd.ms-word',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'document.doc';
    link.click();
  };

  const exportToPDF = async () => {
    if (!editor) return;

    // Note: This is a basic implementation
    // For better PDF generation, you should use a library like jsPDF or html2pdf
    const content = editor.getHTML();

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Print</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            img { max-width: 100%; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #ddd; padding: 8px; }
          </style>
        </head>
        <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
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
      <EditorToolbar
        editor={editor}
        onSave={onSave ? handleManualSave : undefined}
        isSaving={isSaving}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        showScrollbar={showScrollbar}
        onToggleScrollbar={() => setShowScrollbar(!showScrollbar)}
        onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
        onOpenDrawTool={() => setShowDrawTool(true)}
        onExportWord={exportToWord}
        onExportPDF={exportToPDF}
        onInsertEmbed={handleInsertEmbed}
        onToggleHtml={() => setShowHtml(!showHtml)}
      />

      {showFindReplace && (
        <FindReplace
          editor={editor}
          onClose={() => setShowFindReplace(false)}
        />
      )}

      {showTableToolbar && (
        <TableToolbar
          editor={editor}
          onClose={() => setShowTableToolbar(false)}
        />
      )}

      <div
        className={`${
          showScrollbar ? 'overflow-y-auto' : 'scrollbar-hidden overflow-y-auto'
        } ${isFullscreen ? 'h-[calc(100vh-120px)]' : ''}`}
        style={{
          minHeight: isFullscreen ? 'auto' : minHeight,
          maxHeight: isFullscreen ? 'calc(100vh - 120px)' : maxHeight,
        }}
      >
        <div className="relative p-6">
          {showHtml ? (
            <textarea
              value={editor.getHTML()}
              onChange={e => editor.commands.setContent(e.target.value)}
              className="h-full w-full p-4 font-mono text-sm"
            />
          ) : (
            <>
              <BubbleMenu editor={editor} />
              <ImageBubbleMenu editor={editor} />
              <EditorContent editor={editor} />
            </>
          )}
        </div>
      </div>

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

      {/* Draw Tool Modal */}
      {showDrawTool && (
        <DrawTool
          onInsert={handleDrawToolInsert}
          onClose={() => setShowDrawTool(false)}
        />
      )}
    </div>
  );
}
