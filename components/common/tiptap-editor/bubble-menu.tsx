'use client';

import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Highlighter,
  Palette,
} from 'lucide-react';
import { useState } from 'react';
import ColorPicker from './color-picker';
import { NodeSelection } from '@tiptap/pm/state';

interface BubbleMenuProps {
  editor: Editor;
}

export default function BubbleMenu({ editor }: BubbleMenuProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState<'text' | 'highlight'>(
    'text',
  );
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const shouldShow = ({ state }: any) => {
    if (state.selection instanceof NodeSelection) {
      if (state.selection.node?.type.name === 'image') {
        return false;
      }
    }

    const { $from, $to } = state.selection;
    return $from.pos !== $to.pos;
  };

  const handleTextColor = () => {
    setColorPickerType('text');
    setShowColorPicker(true);
  };

  const handleHighlight = () => {
    setColorPickerType('highlight');
    setShowColorPicker(true);
  };

  const handleColorChange = (color: string) => {
    if (colorPickerType === 'text') {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
  };

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setShowLinkInput(true);
  };

  const applyLink = () => {
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
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const Button = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
        isActive
          ? 'bg-[var(--color-primary)] text-white'
          : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)]'
      }`}
    >
      {children}
    </button>
  );

  return (
    <>
      <TiptapBubbleMenu
        editor={editor}
        shouldShow={shouldShow}
        options={{
          placement: 'top',
          offset: 8,
          strategy: 'absolute',
          flip: {
            fallbackPlacements: ['bottom', 'top'],
          },
          shift: {
            padding: 8,
          },
        }}
        className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-1 shadow-lg"
      >
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />

        <Button
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleSetLink}
          isActive={editor.isActive('link')}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />

        <Button onClick={handleTextColor} title="Text Color">
          <Palette className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleHighlight}
          isActive={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </Button>
      </TiptapBubbleMenu>

      {showLinkInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-[var(--color-background)] p-4 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold">Insert Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') applyLink();
                if (e.key === 'Escape') setShowLinkInput(false);
              }}
              placeholder="https://example.com"
              className="mb-3 w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLinkInput(false)}
                className="rounded px-3 py-1.5 text-sm hover:bg-[var(--color-accent)]"
              >
                Cancel
              </button>
              <button
                onClick={applyLink}
                className="rounded bg-[var(--color-primary)] px-3 py-1.5 text-sm text-white hover:opacity-90"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {showColorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <ColorPicker
            currentColor={
              colorPickerType === 'text'
                ? editor.getAttributes('textStyle').color || '#000000'
                : '#fef08a'
            }
            onColorChange={handleColorChange}
            type={colorPickerType}
            onClose={() => setShowColorPicker(false)}
          />
        </div>
      )}
    </>
  );
}
