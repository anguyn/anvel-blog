import { Extension } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { Mention } from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';

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

// Enhanced Image Extension with resize and wrapping
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { style: `width: ${attributes.width}` };
        },
      },
      height: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { style: `height: ${attributes.height}` };
        },
      },
      align: {
        default: 'left',
        renderHTML: attributes => {
          const align = attributes.align || 'left';
          return { 'data-align': align };
        },
      },
      wrapping: {
        default: 'wrap',
        renderHTML: attributes => {
          const wrapping = attributes.wrapping || 'wrap';
          return { 'data-wrapping': wrapping };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes['data-align'] || 'left';
    const wrapping = HTMLAttributes['data-wrapping'] || 'wrap';

    const wrapperStyles: Record<string, string> = {
      left: 'float: left; margin: 0.5rem 1rem 0.5rem 0;',
      center: 'display: block; margin: 1rem auto;',
      right: 'float: right; margin: 0.5rem 0 0.5rem 1rem;',
      inline: 'display: inline-block; vertical-align: middle;',
    };

    const wrappingStyles: Record<string, string> = {
      wrap: '',
      nowrap: 'clear: both;',
      tight: 'margin: 0.25rem;',
    };

    // Remove data attributes before passing to img
    const {
      'data-align': _,
      'data-wrapping': __,
      ...imgAttributes
    } = HTMLAttributes;

    return [
      'span',
      {
        class: 'image-wrapper',
        style: (wrapperStyles[align] || '') + (wrappingStyles[wrapping] || ''),
      },
      ['img', imgAttributes],
    ];
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('span');
      container.className = 'image-wrapper';
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.style.maxWidth = '100%';
      container.setAttribute('data-drag-handle', '');

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.draggable = false;

      if (node.attrs.width) img.style.width = node.attrs.width;
      if (node.attrs.height) img.style.height = node.attrs.height;

      // Apply alignment and wrapping
      const align = node.attrs.align || 'left';
      const wrapping = node.attrs.wrapping || 'wrap';

      const wrapperStyles: Record<string, string> = {
        left: 'float: left; margin: 0.5rem 1rem 0.5rem 0;',
        center: 'display: block; margin: 1rem auto; text-align: center;',
        right: 'float: right; margin: 0.5rem 0 0.5rem 1rem;',
        inline: 'display: inline-block; vertical-align: middle;',
      };

      if (wrapperStyles[align]) {
        const styles = wrapperStyles[align].split(';');
        styles.forEach(style => {
          const [prop, val] = style.split(':').map(s => s.trim());
          if (prop && val) {
            (container.style as any)[
              prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase())
            ] = val;
          }
        });
      }

      // Resize handles
      const handles = ['nw', 'ne', 'sw', 'se'];
      const resizeHandles = handles.map(position => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${position}`;
        handle.style.cssText = `
          position: absolute;
          width: 12px;
          height: 12px;
          background: var(--color-primary, #3b82f6);
          border: 2px solid white;
          border-radius: 50%;
          cursor: ${position.includes('n') ? (position.includes('w') ? 'nw' : 'ne') : position.includes('w') ? 'sw' : 'se'}-resize;
          opacity: 0;
          transition: opacity 0.2s;
          ${position.includes('n') ? 'top: -6px;' : 'bottom: -6px;'}
          ${position.includes('w') ? 'left: -6px;' : 'right: -6px;'}
          z-index: 10;
        `;
        return handle;
      });

      container.addEventListener('mouseenter', () => {
        resizeHandles.forEach(h => (h.style.opacity = '1'));
      });

      container.addEventListener('mouseleave', () => {
        resizeHandles.forEach(h => (h.style.opacity = '0'));
      });

      // Resize logic
      resizeHandles.forEach((handle, index) => {
        let isResizing = false;
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;
        const position = handles[index];

        handle.addEventListener('mousedown', e => {
          e.preventDefault();
          e.stopPropagation();
          isResizing = true;
          startX = e.clientX;
          startY = e.clientY;
          startWidth = img.offsetWidth;
          startHeight = img.offsetHeight;

          const onMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const diffX = e.clientX - startX;
            const diffY = e.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (position.includes('e')) {
              newWidth = Math.max(100, startWidth + diffX);
            } else if (position.includes('w')) {
              newWidth = Math.max(100, startWidth - diffX);
            }

            if (position.includes('s')) {
              newHeight = Math.max(100, startHeight + diffY);
            } else if (position.includes('n')) {
              newHeight = Math.max(100, startHeight - diffY);
            }

            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;
          };

          const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;

            if (typeof getPos === 'function') {
              const pos = getPos();
              if (pos !== undefined) {
                editor
                  .chain()
                  .setNodeSelection(pos)
                  .updateAttributes('image', {
                    width: img.style.width,
                    height: img.style.height,
                  })
                  .run();
              }
            }

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });

        container.appendChild(handle);
      });

      container.appendChild(img);

      return {
        dom: container,
        update: updatedNode => {
          if (updatedNode.type.name !== 'image') return false;
          img.src = updatedNode.attrs.src;
          if (updatedNode.attrs.width)
            img.style.width = updatedNode.attrs.width;
          if (updatedNode.attrs.height)
            img.style.height = updatedNode.attrs.height;
          return true;
        },
      };
    };
  },
});

const MentionList = ({ items, command }: any) => {
  return (
    <div className="mention-list">
      {items.map((item: any, index: number) => (
        <button
          key={index}
          onClick={() => command({ id: item.id, label: item.name })}
          className="mention-item"
        >
          {item.name}
        </button>
      ))}
    </div>
  );
};

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
        let component: any;
        let popup: any;

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
            return component.ref?.onKeyDown(props);
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
