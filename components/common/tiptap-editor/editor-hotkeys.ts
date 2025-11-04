// Keyboard shortcuts configuration for TipTap Editor

export const EDITOR_HOTKEYS = {
  // Text formatting
  'Mod-b': 'Bold',
  'Mod-i': 'Italic',
  'Mod-u': 'Underline',
  'Mod-Shift-s': 'Strikethrough',
  'Mod-e': 'Code',

  // Headings
  'Mod-Alt-1': 'Heading 1',
  'Mod-Alt-2': 'Heading 2',
  'Mod-Alt-3': 'Heading 3',

  // Lists
  'Mod-Shift-8': 'Bullet List',
  'Mod-Shift-7': 'Numbered List',
  Tab: 'Indent (in list)',
  'Shift-Tab': 'Outdent (in list)',

  // Alignment
  'Mod-Shift-l': 'Align Left',
  'Mod-Shift-e': 'Align Center',
  'Mod-Shift-r': 'Align Right',

  // Other
  'Mod-k': 'Insert Link',
  'Mod-z': 'Undo',
  'Mod-Shift-z': 'Redo',
  'Mod-y': 'Redo (Windows)',
  'Mod-f': 'Find & Replace',
  'Mod-Enter': 'Insert Hard Break',
  'Mod-Shift-x': 'Strikethrough',

  // Block operations
  'Mod-Alt-c': 'Code Block',
  'Mod->': 'Blockquote',
  'Mod-Shift-h': 'Highlight',
};

export function getHotkeyDescription(key: string): string {
  const isMac = typeof window !== 'undefined' && /Mac/.test(navigator.platform);
  return key.replace('Mod', isMac ? '⌘' : 'Ctrl');
}
