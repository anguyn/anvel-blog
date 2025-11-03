'use client';

import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LineChart,
  Maximize,
  Minimize,
  Search,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { FONT_SIZES, LINE_HEIGHTS, CODE_LANGUAGES } from './editor-constants';
import ColorPicker from './color-picker';

interface EditorToolbarProps {
  editor: Editor;
  onSave?: () => void;
  isSaving?: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showScrollbar: boolean;
  onToggleScrollbar: () => void;
  onToggleFindReplace: () => void;
}

export default function EditorToolbar({
  editor,
  onSave,
  isSaving,
  isFullscreen,
  onToggleFullscreen,
  showScrollbar,
  onToggleScrollbar,
  onToggleFindReplace,
}: EditorToolbarProps) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlign, setImageAlign] = useState('left');
  const [imageWrapping, setImageWrapping] = useState('wrap');

  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState('3');
  const [tableCols, setTableCols] = useState('3');

  const [showCodeBlockDialog, setShowCodeBlockDialog] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');

  const [customFontSize, setCustomFontSize] = useState('');
  const [customLineHeight, setCustomLineHeight] = useState('');

  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] =
    useState(false);

  const fontSizeInputRef = useRef<HTMLInputElement>(null);
  const lineHeightInputRef = useRef<HTMLInputElement>(null);

  const ToolbarButton = ({
    onClick,
    isActive,
    title,
    children,
    disabled,
  }: {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded p-0 transition-colors ${
        isActive
          ? 'bg-[var(--color-primary)] text-white'
          : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          const base64 = e.target?.result as string;
          setImageUrl(base64);
          setShowImageDialog(true);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const insertImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();

      // Apply attributes
      const { state } = editor;
      const { selection } = state;
      const node = state.doc.nodeAt(selection.from - 1);
      if (node && node.type.name === 'image') {
        editor.commands.updateAttributes('image', {
          align: imageAlign,
          wrapping: imageWrapping,
        });
      }

      setShowImageDialog(false);
      setImageUrl('');
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setShowLinkDialog(true);
  };

  const insertLink = () => {
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }
    setShowLinkDialog(false);
    setLinkUrl('');
  };

  const insertTable = () => {
    const rows = parseInt(tableRows) || 3;
    const cols = parseInt(tableCols) || 3;
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setShowTableDialog(false);
    setTableRows('3');
    setTableCols('3');
  };

  const insertCodeBlock = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'codeBlock',
        attrs: { language: codeLanguage },
      })
      .run();
    setShowCodeBlockDialog(false);
  };

  const applyFontSize = () => {
    if (customFontSize && !isNaN(parseInt(customFontSize))) {
      editor.chain().focus().setFontSize(`${customFontSize}px`).run();
    }
  };

  const applyLineHeight = () => {
    if (customLineHeight && !isNaN(parseFloat(customLineHeight))) {
      editor.chain().focus().setLineHeight(customLineHeight).run();
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-[var(--color-border)] bg-[var(--color-muted)] p-2">
        {/* Headings */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="mx-1 h-8 w-px bg-[var(--color-border)]" />

        {/* Basic Formatting */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="mx-1 h-8 w-px bg-[var(--color-border)]" />

        {/* Font Size */}
        <div className="flex items-center gap-1">
          <input
            ref={fontSizeInputRef}
            type="text"
            list="font-sizes"
            placeholder="Size"
            value={customFontSize}
            onChange={e => setCustomFontSize(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                applyFontSize();
                fontSizeInputRef.current?.blur();
              }
            }}
            onBlur={applyFontSize}
            className="h-8 w-[80px] rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs"
          />
          <datalist id="font-sizes">
            {FONT_SIZES.map(size => (
              <option key={size} value={size.replace('px', '')} />
            ))}
          </datalist>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            px
          </span>
        </div>

        <div className="mx-1 h-8 w-px bg-[var(--color-border)]" />

        {/* Line Height */}
        <div className="flex items-center gap-1">
          <LineChart className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          <input
            ref={lineHeightInputRef}
            type="text"
            list="line-heights"
            placeholder="1.5"
            value={customLineHeight}
            onChange={e => setCustomLineHeight(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                applyLineHeight();
                lineHeightInputRef.current?.blur();
              }
            }}
            onBlur={applyLineHeight}
            className="h-8 w-[60px] rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs"
          />
          <datalist id="line-heights">
            {LINE_HEIGHTS.map(height => (
              <option key={height} value={height} />
            ))}
          </datalist>
        </div>

        <div className="mx-1 h-8 w-px bg-[var(--color-border)]" />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="mx-1 h-8 w-px bg-[var(--color-border)]" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="mx-1 h-8 w-px bg-[var(--color-border)]" />

        {/* Insert */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Upload Image">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowTableDialog(true)}
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowCodeBlockDialog(true)}
            title="Code Block"
          >
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="mx-1 h-8 w-px bg-[var(--color-border)]" />

        {/* Color Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTextColorPicker(true)}
            className="flex h-8 items-center gap-1 rounded px-2 hover:bg-[var(--color-accent)]"
            title="Text Color"
          >
            <span className="text-xs">A</span>
            <div
              className="h-1 w-4 rounded"
              style={{
                backgroundColor:
                  editor.getAttributes('textStyle').color || '#000000',
              }}
            />
          </button>
          <button
            onClick={() => setShowHighlightColorPicker(true)}
            className="flex h-8 items-center gap-1 rounded px-2 hover:bg-[var(--color-accent)]"
            title="Highlight"
          >
            <span className="text-xs">H</span>
            <div className="h-1 w-4 rounded bg-yellow-300" />
          </button>
        </div>

        <div className="mx-1 h-8 w-px bg-[var(--color-border)]" />

        {/* History */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="mx-1 h-8 w-px bg-[var(--color-border)]" />

        {/* Utilities */}
        <div className="ml-auto flex items-center gap-1">
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1 rounded bg-[var(--color-primary)] px-3 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          <ToolbarButton
            onClick={onToggleScrollbar}
            isActive={showScrollbar}
            title="Toggle Scrollbar"
          >
            {showScrollbar ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </ToolbarButton>
          <ToolbarButton
            onClick={onToggleFindReplace}
            title="Find & Replace (Ctrl+F)"
          >
            <Search className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={onToggleFullscreen} title="Fullscreen">
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </ToolbarButton>
        </div>
      </div>

      {/* Dialogs */}
      {showImageDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-[var(--color-background)] p-6">
            <h2 className="mb-4 text-xl font-bold">Insert Image</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Image URL
                </label>
                <input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Alignment
                </label>
                <select
                  value={imageAlign}
                  onChange={e => setImageAlign(e.target.value)}
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                >
                  <option value="left">Float Left</option>
                  <option value="center">Center</option>
                  <option value="right">Float Right</option>
                  <option value="inline">Inline</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Text Wrapping
                </label>
                <select
                  value={imageWrapping}
                  onChange={e => setImageWrapping(e.target.value)}
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                >
                  <option value="wrap">Wrap Text</option>
                  <option value="nowrap">No Wrap</option>
                  <option value="tight">Tight</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowImageDialog(false)}
                className="rounded border border-[var(--color-border)] px-4 py-2 hover:bg-[var(--color-accent)]"
              >
                Cancel
              </button>
              <button
                onClick={insertImage}
                className="rounded bg-[var(--color-primary)] px-4 py-2 text-white hover:opacity-90"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-[var(--color-background)] p-6">
            <h2 className="mb-4 text-xl font-bold">Insert Link</h2>
            <input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="rounded border border-[var(--color-border)] px-4 py-2 hover:bg-[var(--color-accent)]"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                className="rounded bg-[var(--color-primary)] px-4 py-2 text-white hover:opacity-90"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Dialog */}
      {showTableDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-[var(--color-background)] p-6">
            <h2 className="mb-4 text-xl font-bold">Insert Table</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={e => setTableRows(e.target.value)}
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Columns
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={e => setTableCols(e.target.value)}
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowTableDialog(false)}
                className="rounded border border-[var(--color-border)] px-4 py-2 hover:bg-[var(--color-accent)]"
              >
                Cancel
              </button>
              <button
                onClick={insertTable}
                className="rounded bg-[var(--color-primary)] px-4 py-2 text-white hover:opacity-90"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Block Dialog */}
      {showCodeBlockDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-[var(--color-background)] p-6">
            <h2 className="mb-4 text-xl font-bold">Insert Code Block</h2>
            <div>
              <label className="mb-1 block text-sm font-medium">Language</label>
              <select
                value={codeLanguage}
                onChange={e => setCodeLanguage(e.target.value)}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              >
                {CODE_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCodeBlockDialog(false)}
                className="rounded border border-[var(--color-border)] px-4 py-2 hover:bg-[var(--color-accent)]"
              >
                Cancel
              </button>
              <button
                onClick={insertCodeBlock}
                className="rounded bg-[var(--color-primary)] px-4 py-2 text-white hover:opacity-90"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Pickers */}
      {showTextColorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <ColorPicker
            currentColor={editor.getAttributes('textStyle').color || '#000000'}
            onColorChange={color =>
              editor.chain().focus().setColor(color).run()
            }
            type="text"
            onClose={() => setShowTextColorPicker(false)}
          />
        </div>
      )}

      {showHighlightColorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <ColorPicker
            currentColor="#fef08a"
            onColorChange={color =>
              editor.chain().focus().toggleHighlight({ color }).run()
            }
            type="highlight"
            onClose={() => setShowHighlightColorPicker(false)}
          />
        </div>
      )}
    </>
  );
}
