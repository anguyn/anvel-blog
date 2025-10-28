'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);
import { uploadMediaAction } from '@/app/actions/media.action';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Code2,
  Minus,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight = '500px',
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Image.configure({
        inline: true,
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
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg focus:outline-none max-w-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const addImage = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const result = await uploadMediaAction(formData);

          if (result.success && result.media) {
            editor?.chain().focus().setImage({ src: result.media.url }).run();
            toast.success('Image uploaded successfully');
          } else {
            toast.error(result.error || 'Upload failed');
          }
        } catch (error) {
          toast.error('Failed to upload image');
        }
      }
    };
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="border-border bg-muted/50 w-full rounded-lg border p-4">
        <p className="text-muted-foreground text-center">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="tiptap-wrapper border-border bg-background w-full rounded-lg border">
      {/* Toolbar */}
      <div className="border-border bg-muted flex flex-wrap gap-1 border-b p-2">
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('heading', { level: 4 })
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Heading 4"
        >
          <Heading4 size={18} />
        </button>

        <div className="bg-border mx-1 w-px" />

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('bold') ? 'bg-primary text-primary-foreground' : ''
          }`}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('italic')
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('underline')
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Underline"
        >
          <UnderlineIcon size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('strike')
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('code') ? 'bg-primary text-primary-foreground' : ''
          }`}
          title="Inline Code"
        >
          <Code size={18} />
        </button>

        <div className="bg-border mx-1 w-px" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('bulletList')
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('orderedList')
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>

        <div className="bg-border mx-1 w-px" />

        <button
          onClick={setLink}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('link') ? 'bg-primary text-primary-foreground' : ''
          }`}
          title="Link"
        >
          <LinkIcon size={18} />
        </button>
        <button
          onClick={addImage}
          className="hover:bg-accent rounded p-2"
          title="Upload Image"
        >
          <ImageIcon size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('blockquote')
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Blockquote"
        >
          <Quote size={18} />
        </button>
        <button
          onClick={addTable}
          className="hover:bg-accent rounded p-2"
          title="Insert Table"
        >
          <TableIcon size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`hover:bg-accent rounded p-2 ${
            editor.isActive('codeBlock')
              ? 'bg-primary text-primary-foreground'
              : ''
          }`}
          title="Code Block"
        >
          <Code2 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="hover:bg-accent rounded p-2"
          title="Horizontal Line"
        >
          <Minus size={18} />
        </button>

        <div className="bg-border mx-1 w-px" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="hover:bg-accent rounded p-2 disabled:opacity-50"
          title="Undo"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="hover:bg-accent rounded p-2 disabled:opacity-50"
          title="Redo"
        >
          <Redo size={18} />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      <style jsx global>{`
        .tiptap-wrapper .ProseMirror {
          min-height: ${minHeight};
          padding: 1.5rem;
          outline: none;
          line-height: 1.8;
        }

        .tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .tiptap-wrapper .ProseMirror p {
          margin: 1em 0;
          line-height: 1.8;
        }

        .tiptap-wrapper .ProseMirror h1 {
          font-size: 2.5em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
          line-height: 1.3;
        }

        .tiptap-wrapper .ProseMirror h2 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.9em 0 0.5em 0;
          line-height: 1.3;
        }

        .tiptap-wrapper .ProseMirror h3 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.8em 0 0.5em 0;
          line-height: 1.4;
        }

        .tiptap-wrapper .ProseMirror h4 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.7em 0 0.5em 0;
          line-height: 1.4;
        }

        .tiptap-wrapper .ProseMirror blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1.5em;
          margin: 1.5em 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }

        .tiptap-wrapper .ProseMirror code {
          background: hsl(var(--muted));
          padding: 0.2em 0.5em;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
        }

        .tiptap-wrapper .ProseMirror pre {
          background: hsl(var(--muted));
          padding: 1.5em;
          border-radius: 6px;
          overflow-x: auto;
          font-family: 'Courier New', Courier, monospace;
          margin: 1.5em 0;
          line-height: 1.6;
        }

        .tiptap-wrapper .ProseMirror pre code {
          background: none;
          padding: 0;
        }

        .tiptap-wrapper .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5em 0;
        }

        .tiptap-wrapper .ProseMirror table td,
        .tiptap-wrapper .ProseMirror table th {
          border: 1px solid hsl(var(--border));
          padding: 0.75em;
          position: relative;
        }

        .tiptap-wrapper .ProseMirror table th {
          background: hsl(var(--muted));
          font-weight: bold;
        }

        .tiptap-wrapper .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 1.5em 0;
        }

        .tiptap-wrapper .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
          cursor: pointer;
        }

        .tiptap-wrapper .ProseMirror ul,
        .tiptap-wrapper .ProseMirror ol {
          padding-left: 2em;
          margin: 1em 0;
        }

        .tiptap-wrapper .ProseMirror ul li,
        .tiptap-wrapper .ProseMirror ol li {
          margin: 0.5em 0;
          line-height: 1.6;
        }

        .tiptap-wrapper .ProseMirror hr {
          border: none;
          border-top: 2px solid hsl(var(--border));
          margin: 2em 0;
        }

        .tiptap-wrapper .ProseMirror .selectedCell {
          background: hsl(var(--accent));
        }
      `}</style>
    </div>
  );
}
