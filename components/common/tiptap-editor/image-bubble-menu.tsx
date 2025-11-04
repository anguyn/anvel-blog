'use client';

import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { NodeSelection } from '@tiptap/pm/state';

interface ImageBubbleMenuProps {
  editor: Editor;
}

export default function ImageBubbleMenu({ editor }: ImageBubbleMenuProps) {
  const shouldShow = ({ state, from, to }: any) => {
    const { selection } = state;

    // Check if it's a NodeSelection và node là image
    if (
      selection instanceof NodeSelection &&
      selection.node?.type.name === 'image'
    ) {
      return true;
    }

    // Check nếu selection nằm trong image node
    const { $from } = selection;
    const node = $from.parent;

    // Check parent nodes
    for (let depth = $from.depth; depth >= 0; depth--) {
      const node = $from.node(depth);
      if (node && node.type.name === 'image') {
        return true;
      }
    }

    return false;
  };

  const updateImageAlign = (align: string) => {
    editor.chain().focus().updateAttributes('image', { align }).run();
  };

  const updateTextWrap = (textWrap: string) => {
    editor.chain().focus().updateAttributes('image', { textWrap }).run();
  };

  const deleteImage = () => {
    editor.chain().focus().deleteSelection().run();
  };

  const currentAttrs = editor.getAttributes('image');
  const currentTextWrap = currentAttrs.textWrap || 'none';
  const currentAlign = currentAttrs.align || 'left';

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
      {/* Text Wrap Mode */}
      <div className="flex items-center">
        <select
          value={currentTextWrap}
          onChange={e => updateTextWrap(e.target.value)}
          className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs"
          title="Text Wrap"
        >
          <option value="none">Top & Bottom</option>
          <option value="square">Wrap Text</option>
        </select>
      </div>

      <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />

      {/* Alignment - hide center when in square mode */}
      <div className="flex items-center gap-1">
        <Button
          onClick={() => updateImageAlign('left')}
          isActive={currentAlign === 'left'}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        {currentTextWrap === 'none' && (
          <Button
            onClick={() => updateImageAlign('center')}
            isActive={currentAlign === 'center'}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
        )}
        <Button
          onClick={() => updateImageAlign('right')}
          isActive={currentAlign === 'right'}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />

      {/* Actions */}
      <Button onClick={deleteImage} title="Delete Image">
        <Trash2 className="h-4 w-4" />
      </Button>
    </TiptapBubbleMenu>
  );
}
