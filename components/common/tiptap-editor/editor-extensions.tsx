import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Extension, Node } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { Mention } from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    htmlView: {
      toggleHtml: () => ReturnType;
    };

    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
    drawTool: {
      insertDrawing: (dataUrl: string) => ReturnType;
    };
    embedMedia: {
      insertEmbed: (url: string, type?: string) => ReturnType;
    };
  }
}

// HTML View
export const HtmlView = Extension.create({
  name: 'htmlView',

  addStorage() {
    return {
      showHtml: false,
    };
  },

  addCommands() {
    return {
      toggleHtml:
        () =>
        ({ editor }) => {
          this.storage.showHtml = !this.storage.showHtml;
          return true;
        },
    };
  },
});

// Custom FontSize Extension
export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

// Custom LineHeight Extension
export const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ chain }) => {
          return chain().updateAttributes('paragraph', { lineHeight }).run();
        },
      unsetLineHeight:
        () =>
        ({ chain }) => {
          return chain()
            .updateAttributes('paragraph', { lineHeight: null })
            .run();
        },
    };
  },
});

// Indent/Outdent Extension
export const IndentExtension = Extension.create({
  name: 'indent',
  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
      indentSize: 30,
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const indent = element.style.paddingLeft;
              return indent ? parseInt(indent) / this.options.indentSize : 0;
            },
            renderHTML: attributes => {
              if (!attributes.indent || attributes.indent === 0) {
                return {};
              }
              return {
                style: `padding-left: ${attributes.indent * this.options.indentSize}px`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const newIndent = Math.min(currentIndent + 1, 10);

              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: newIndent,
                });
              }
            }
          });

          if (dispatch) {
            dispatch(tr);
          }

          return true;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const newIndent = Math.max(currentIndent - 1, 0);

              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: newIndent,
                });
              }
            }
          });

          if (dispatch) {
            dispatch(tr);
          }

          return true;
        },
    };
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive('listItem')) {
          return this.editor.commands.sinkListItem('listItem');
        }
        return this.editor.commands.indent();
      },
      'Shift-Tab': () => {
        if (this.editor.isActive('listItem')) {
          return this.editor.commands.liftListItem('listItem');
        }
        return this.editor.commands.outdent();
      },
    };
  },
});

// Enhanced Image Extension with resize and layout options
const ImageNodeView = ({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const {
    src,
    alt,
    width,
    height,
    align = 'left',
    textWrap = 'none',
  } = node.attrs;

  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).style.cursor?.includes('resize')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (typeof getPos === 'function') {
        const pos = getPos();
        if (typeof pos === 'number') {
          const { state } = editor;
          const tr = state.tr;
          const selection = NodeSelection.create(state.doc, pos);

          editor.view.dispatch(tr.setSelection(selection));
          editor.view.focus();
        }
      }
    };

    container.addEventListener('click', handleClick);
    img.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
      img.removeEventListener('click', handleClick);
    };
  }, [editor, getPos]);

  useEffect(() => {
    const nodeWrapper = containerRef.current?.closest(
      '.ProseMirror-selectednode',
    );
    if (textWrap === 'square') {
      if (nodeWrapper) {
        (nodeWrapper as HTMLElement).setAttribute('data-text-wrap', 'square');
      }
    } else {
      if ((nodeWrapper as HTMLElement)?.getAttribute('data-text-wrap'))
        (nodeWrapper as HTMLElement)?.removeAttribute('data-text-wrap');
    }
  }, [textWrap, selected]);

  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'relative',
      cursor: 'pointer',
    };

    if (textWrap === 'square') {
      const style: React.CSSProperties = {
        ...base,
        display: 'inline-block',
        float: align === 'right' ? 'right' : 'left',
        margin:
          align === 'right' ? '0.5rem 0 0.5rem 1rem' : '0.5rem 1rem 0.5rem 0',
      };

      if (selected) {
        style.outline = '2px solid var(--color-primary, #3b82f6)';
        style.outlineOffset = '2px';
      }

      return style;
    } else {
      const style: React.CSSProperties = {
        ...base,
        display: 'block',
        clear: 'both',
        margin: '1rem 0',
      };

      if (align === 'center') {
        style.marginLeft = 'auto';
        style.marginRight = 'auto';
        style.width = width || 'fit-content';
      } else if (align === 'right') {
        style.marginLeft = 'auto';
        style.marginRight = '0';
        style.width = width || 'fit-content';
      } else {
        style.marginLeft = '0';
        style.marginRight = 'auto';
        style.width = width || 'fit-content';
      }

      if (selected) {
        style.outline = '2px dashed var(--color-primary, #3b82f6)';
        style.outlineOffset = '4px';
      }

      return style;
    }
  };

  const handleResize = (e: React.MouseEvent, position: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = imgRef.current?.offsetWidth || 0;
    const startHeight = imgRef.current?.offsetHeight || 0;
    const aspectRatio = startWidth / startHeight;

    const isCorner = position.length === 2;

    editor.setEditable(false);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!imgRef.current || !containerRef.current) return;

      const diffX = moveEvent.clientX - startX;
      const diffY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (isCorner) {
        if (position.includes('e')) {
          newWidth = Math.max(50, startWidth + diffX);
        } else if (position.includes('w')) {
          newWidth = Math.max(50, startWidth - diffX);
        }
        newHeight = newWidth / aspectRatio;
      } else {
        if (position === 'e' || position === 'w') {
          if (position === 'e') {
            newWidth = Math.max(50, startWidth + diffX);
          } else {
            newWidth = Math.max(50, startWidth - diffX);
          }
          newHeight = startHeight;
        } else if (position === 'n' || position === 's') {
          if (position === 's') {
            newHeight = Math.max(50, startHeight + diffY);
          } else {
            newHeight = Math.max(50, startHeight - diffY);
          }
          newWidth = startWidth;
        }
      }

      imgRef.current.style.width = `${newWidth}px`;
      imgRef.current.style.height = `${newHeight}px`;

      if (textWrap === 'none') {
        containerRef.current.style.width = `${newWidth}px`;
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      editor.setEditable(true);

      if (imgRef.current) {
        updateAttributes({
          width: imgRef.current.style.width,
          height: imgRef.current.style.height,
        });
      }

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <NodeViewWrapper as="div" style={getContainerStyle()} data-drag-handle>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'inline-block',
          width: 'fit-content',
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={{
            width: width || 'auto',
            height: height || 'auto',
            maxWidth: textWrap === 'square' ? '100%' : 'none',
            display: 'block',
          }}
          draggable={false}
        />

        {selected && !isResizing && (
          <>
            {['nw', 'ne', 'sw', 'se'].map(pos => (
              <div
                key={pos}
                onMouseDown={e => handleResize(e, pos)}
                style={{
                  position: 'absolute',
                  width: '12px',
                  height: '12px',
                  background: 'var(--color-primary, #3b82f6)',
                  border: '2px solid white',
                  borderRadius: '50%',
                  cursor: `${pos}-resize`,
                  zIndex: 10,
                  ...(pos.includes('n') ? { top: '-6px' } : { bottom: '-6px' }),
                  ...(pos.includes('w') ? { left: '-6px' } : { right: '-6px' }),
                }}
              />
            ))}

            {['n', 'e', 's', 'w'].map(pos => (
              <div
                key={pos}
                onMouseDown={e => handleResize(e, pos)}
                style={{
                  position: 'absolute',
                  background: 'var(--color-primary, #3b82f6)',
                  border: '2px solid white',
                  zIndex: 10,
                  ...(pos === 'n' || pos === 's'
                    ? {
                        width: '40px',
                        height: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        cursor: 'ns-resize',
                        ...(pos === 'n' ? { top: '-4px' } : { bottom: '-4px' }),
                      }
                    : {
                        width: '8px',
                        height: '40px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'ew-resize',
                        ...(pos === 'w' ? { left: '-4px' } : { right: '-4px' }),
                      }),
                }}
              />
            ))}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      align: {
        default: 'left',
      },
      textWrap: {
        default: 'none',
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { width, height, align, textWrap, src, alt, title } = HTMLAttributes;

    let imgStyle = '';
    if (width) imgStyle += `width: ${width};`;
    if (height) imgStyle += `height: ${height};`;
    imgStyle += 'max-width: 100%; height: auto; display: block;';

    let wrapperStyle =
      'position: relative; display: inline-block; max-width: 100%;';

    if (textWrap === 'square') {
      if (align === 'left') {
        wrapperStyle += 'float: left; margin: 0.5rem 1rem 0.5rem 0;';
      } else if (align === 'right') {
        wrapperStyle += 'float: right; margin: 0.5rem 0 0.5rem 1rem;';
      }
    } else {
      wrapperStyle =
        'position: relative; display: block; clear: both; margin: 1rem 0;';
      if (align === 'center') {
        wrapperStyle +=
          'margin-left: auto; margin-right: auto; text-align: center;';
      } else if (align === 'right') {
        wrapperStyle += 'margin-left: auto; margin-right: 0;';
      } else {
        wrapperStyle += 'margin-left: 0; margin-right: auto;';
      }

      if (width) {
        wrapperStyle += `max-width: ${width};`;
      }
    }

    return [
      'span',
      {
        class: 'image-wrapper',
        style: wrapperStyle,
        'data-align': align,
        'data-text-wrap': textWrap,
      },
      [
        'img',
        {
          src,
          alt,
          title,
          style: imgStyle,
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

// Mention List Component
export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { items, command } = props;

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command({ id: item.id, label: item.name });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="mention-list">
      {items.length ? (
        items.map((item: any, index: number) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
          >
            {item.name}
          </button>
        ))
      ) : (
        <div className="mention-item">No results</div>
      )}
    </div>
  );
});
MentionList.displayName = 'MentionList';

// Mention Extension Configuration
export const configureMention = (
  users: Array<{ id: string; name: string }>,
) => {
  return Mention.configure({
    HTMLAttributes: {
      class: 'mention',
    },
    suggestion: {
      items: ({ query }: { query: string }) => {
        return users
          .filter(user =>
            user.name.toLowerCase().startsWith(query.toLowerCase()),
          )
          .slice(0, 5);
      },
      render: () => {
        let component: ReactRenderer;
        let popup: TippyInstance[];

        return {
          onStart: (props: any) => {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            });

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            });
          },
          onUpdate(props: any) {
            component.updateProps(props);

            popup[0].setProps({
              getReferenceClientRect: props.clientRect,
            });
          },
          onKeyDown(props: any) {
            if (props.event.key === 'Escape') {
              popup[0].hide();
              return true;
            }
            return (component.ref as any)?.onKeyDown?.(props);
          },
          onExit() {
            popup[0].destroy();
            component.destroy();
          },
        };
      },
    },
  });
};

// Embed Node View
const EmbedNodeView = ({ node }: any) => {
  const { src, type, width, height } = node.attrs;

  return (
    <NodeViewWrapper className="embed-wrapper">
      <div
        style={{
          position: 'relative',
          paddingBottom: `${(height / width) * 100}%`,
          height: 0,
          overflow: 'hidden',
          maxWidth: '100%',
          margin: '1rem 0',
        }}
      >
        <iframe
          src={src}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          allowFullScreen
        />
      </div>
    </NodeViewWrapper>
  );
};

// Embed Configuration
interface EmbedConfig {
  regex: RegExp;
  embedUrl: (match: RegExpMatchArray) => string;
  width?: number;
  height?: number;
}

const EMBED_CONFIGS: Record<string, EmbedConfig> = {
  youtube: {
    regex:
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    embedUrl: match => `https://www.youtube.com/embed/${match[1]}`,
    width: 560,
    height: 315,
  },
  vimeo: {
    regex: /vimeo\.com\/(\d+)/,
    embedUrl: match => `https://player.vimeo.com/video/${match[1]}`,
    width: 560,
    height: 315,
  },
  twitter: {
    regex: /twitter\.com\/\w+\/status\/(\d+)/,
    embedUrl: match =>
      `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`,
    width: 550,
    height: 400,
  },
  codepen: {
    regex: /codepen\.io\/(\w+)\/pen\/([a-zA-Z0-9]+)/,
    embedUrl: match =>
      `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result`,
    width: 600,
    height: 400,
  },
  codesandbox: {
    regex: /codesandbox\.io\/s\/([a-zA-Z0-9-]+)/,
    embedUrl: match => `https://codesandbox.io/embed/${match[1]}`,
    width: 600,
    height: 400,
  },
};

function detectEmbedType(
  url: string,
): { type: string; config: EmbedConfig } | null {
  for (const [type, config] of Object.entries(EMBED_CONFIGS)) {
    const match = url.match(config.regex);
    if (match) {
      return { type, config };
    }
  }
  return null;
}

// Embed Media Extension
export const EmbedMedia = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => {
          const dataSrc = element.getAttribute('data-src');
          if (dataSrc) return dataSrc;
          const iframe = element.querySelector('iframe');
          return iframe?.getAttribute('src') || null;
        },
        renderHTML: attributes => {
          // KEY FIX: Phải return object với key 'data-src'
          if (!attributes.src) return {};
          return { 'data-src': attributes.src };
        },
      },
      type: {
        default: 'youtube',
        parseHTML: element => element.getAttribute('data-type') || 'youtube',
        renderHTML: attributes => {
          return { 'data-type': attributes.type };
        },
      },
      width: {
        default: 560,
        parseHTML: element => {
          const width = element.getAttribute('data-width');
          return width ? parseInt(width) : 560;
        },
        renderHTML: attributes => {
          return { 'data-width': String(attributes.width) };
        },
      },
      height: {
        default: 315,
        parseHTML: element => {
          const height = element.getAttribute('data-height');
          return height ? parseInt(height) : 315;
        },
        renderHTML: attributes => {
          return { 'data-height': String(attributes.height) };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-embed]',
        getAttrs: dom => {
          const iframe = dom.querySelector('iframe');
          const src =
            dom.getAttribute('data-src') || iframe?.getAttribute('src');

          return src
            ? {
                src,
                type: dom.getAttribute('data-type') || 'youtube',
                width: parseInt(dom.getAttribute('data-width') || '560'),
                height: parseInt(dom.getAttribute('data-height') || '315'),
              }
            : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, width, height } = HTMLAttributes;
    return [
      'div',
      { 'data-embed': true, class: 'embed-wrapper' },
      [
        'div',
        {
          style: `position: relative; padding-bottom: ${((HTMLAttributes['data-height'] || height) / (HTMLAttributes['data-width'] || width)) * 100}%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;`,
        },
        [
          'iframe',
          {
            src: HTMLAttributes['data-src'] || src,
            style:
              'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;',
            allowfullscreen: true,
          },
        ],
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView);
  },

  addCommands() {
    return {
      insertEmbed:
        (url: string) =>
        ({ commands }) => {
          const detected = detectEmbedType(url);
          if (!detected) return false;

          const { config } = detected;
          const embedUrl = config.embedUrl(url.match(config.regex)!);

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: embedUrl,
              type: detected.type,
              width: config.width || 560,
              height: config.height || 315,
            },
          });
        },
    };
  },
});

// Draw Tool Extension
export const DrawToolExtension = Extension.create({
  name: 'drawTool',

  addCommands() {
    return {
      insertDrawing:
        (dataUrl: string) =>
        ({ commands }) => {
          return commands.setImage({ src: dataUrl });
        },
    };
  },
});
