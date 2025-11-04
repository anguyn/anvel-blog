// Editor Constants
export const FONT_FAMILIES = [
  { value: '', label: 'Default' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Impact', label: 'Impact' },
];

export const FONT_SIZES = [
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '36px',
  '48px',
  '64px',
];

export const LINE_HEIGHTS = ['1', '1.15', '1.5', '1.75', '2', '2.5', '3'];

export const CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'cpp',
  'ruby',
  'go',
  'rust',
  'php',
  'swift',
  'kotlin',
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'markdown',
  'bash',
  'sql',
  'plaintext',
];

export const DEFAULT_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Black', value: '#000000' },
];

export const IMAGE_ALIGNMENTS = [
  { value: 'left', label: 'Float Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Float Right' },
  { value: 'inline', label: 'Inline' },
] as const;

export const IMAGE_WRAPPING = [
  { value: 'wrap', label: 'Wrap Text' },
  { value: 'nowrap', label: 'No Wrap' },
  { value: 'tight', label: 'Tight' },
] as const;
