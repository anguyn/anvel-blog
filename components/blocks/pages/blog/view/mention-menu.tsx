'use client';

import { useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/libs/utils';

export interface MentionUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
}

interface MentionMenuProps {
  users: MentionUser[];
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
  isSearching?: boolean;
  anchorEl: HTMLElement | null;
  mentionStartPos: number | null;
}

function getCaretPosition(
  element: HTMLElement,
  mentionStartPos: number,
): {
  top: number;
  left: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();

  const range = document.createRange();
  let charIndex = 0;
  let found = false;

  function traverse(node: Node) {
    if (found) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;
      if (charIndex + textLength >= mentionStartPos) {
        range.setStart(node, mentionStartPos - charIndex);
        range.setEnd(node, mentionStartPos - charIndex);
        found = true;
        return;
      }
      charIndex += textLength;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as HTMLElement).classList?.contains('mention')) {
        const textLength = node.textContent?.length || 0;
        charIndex += textLength;
        return;
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
        if (found) return;
      }
    }
  }

  traverse(element);

  if (!found) {
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      height: 20,
    };
  }

  const rangeRect = range.getBoundingClientRect();

  return {
    top: rangeRect.top + window.scrollY,
    left: rangeRect.left + window.scrollX,
    height: rangeRect.height || 20,
  };
}

export function MentionMenu({
  users,
  selectedIndex,
  onSelect,
  isSearching,
  anchorEl,
  mentionStartPos,
}: MentionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorEl && mentionStartPos !== null) {
      const coords = getCaretPosition(anchorEl, mentionStartPos);
      const viewportHeight = window.innerHeight;
      const menuHeight = Math.min(192, users.length * 60);

      let top = coords.top + coords.height - 45;
      const left = coords.left;

      if (top + menuHeight > viewportHeight + window.scrollY) {
        top = coords.top - menuHeight - 4;
      }

      setPosition({ top, left });
    }
  }, [anchorEl, mentionStartPos, users.length]);

  useEffect(() => {
    if (menuRef.current && !isSearching && users.length > 0) {
      const selectedItem = menuRef.current.children[
        selectedIndex
      ] as HTMLElement;
      selectedItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, isSearching, users.length]);

  if (!anchorEl || mentionStartPos === null) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
        maxHeight: '192px',
      }}
      className="bg-popover w-64 overflow-y-auto rounded-lg border shadow-lg"
      onMouseDown={e => e.preventDefault()}
    >
      {isSearching ? (
        <div className="text-muted-foreground px-4 py-3 text-sm">
          Đang tìm...
        </div>
      ) : users.length === 0 ? (
        <div className="text-muted-foreground px-4 py-3 text-sm">
          Không tìm thấy
        </div>
      ) : (
        users.map((user, index) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user)}
            className={cn(
              'hover:bg-accent flex w-full items-center gap-3 px-4 py-2 transition-colors',
              index === selectedIndex && 'bg-accent',
            )}
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.username}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="bg-secondary flex h-8 w-8 items-center justify-center rounded-full">
                <User className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-medium">
                {user.name || user.username}
              </div>
              <div className="text-muted-foreground text-xs">
                @{user.username}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
