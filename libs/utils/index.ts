import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function getLanguageColor(language: string = 'other'): string {
  const colors: { [key: string]: string } = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    python: '#3776ab',
    java: '#007396',
    cpp: '#00599c',
    c: '#A8B9CC',
    csharp: '#239120',
    ruby: '#cc342d',
    go: '#00add8',
    rust: '#000000',
    php: '#777bb4',
    swift: '#fa7343',
    kotlin: '#7f52ff',
    html: '#e34c26',
    css: '#563d7c',
    sql: '#00758f',
    other: 'f33c26',
  };

  return colors[language.toLowerCase()] || '#6b7280';
}

export function truncateCode(code: string, maxLength: number = 200): string {
  if (code.length <= maxLength) return code;
  return code.substring(0, maxLength) + '...';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

export async function serverFetch(
  url: string,
  cookieHeader: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: cookieHeader,
    },
  });
}

export function formatCookies(
  cookies: Array<{ name: string; value: string }>,
): string {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      return word[0].toLocaleUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Convert R2 public URL to proxied URL
 */
export function getProxiedImageUrl(r2Url: string): string {
  if (!r2Url) return '';

  if (r2Url.startsWith('/api/images/') || r2Url.startsWith('/images/')) {
    return r2Url;
  }

  const r2PublicUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
  if (!r2PublicUrl) {
    console.warn('R2_PUBLIC_URL not configured');
    return r2Url;
  }

  const path = r2Url.replace(r2PublicUrl + '/', '');

  return `/api/images/${path}`;
}

/**
 * Get avatar URL (proxied)
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string {
  if (!avatarPath) {
    return '/images/default-avatar.png';
  }

  return getProxiedImageUrl(avatarPath);
}

/**
 * Get image URL with optional transformations
 */
export function getImageUrl(
  imagePath: string | null | undefined,
  options?: {
    thumbnail?: boolean;
  },
): string {
  if (!imagePath) {
    return '/images/placeholder.png';
  }

  let url = imagePath;

  if (options?.thumbnail && !url.includes('/thumbnails/')) {
    const parts = url.split('/');
    const filename = parts.pop();
    const folder = parts.join('/');
    url = `${folder}/thumbnails/${filename?.replace(/\.(jpg|jpeg|png|webp)$/, '-thumb.webp')}`;
  }

  return getProxiedImageUrl(url);
}

/**
 * Extract R2 key from URL (for deletion)
 */
export function extractR2Key(url: string): string {
  const r2PublicUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;

  if (url.startsWith('/api/images/')) {
    return url.replace('/api/images/', '');
  }

  if (r2PublicUrl && url.startsWith(r2PublicUrl)) {
    return url.replace(r2PublicUrl + '/', '');
  }

  return url;
}

/**
 * Generate thumbnail URL from a full avatar URL.
 * Example:
 *   https://cdn.anvel.site/avatars/avatar-123.webp
 * → https://cdn.anvel.site/avatars/thumbnails/avatar-123-thumb.webp
 */
export function getThumbnailUrlFromAvatar(url: string): string {
  if (!url || !url.startsWith('http')) return '';

  try {
    const parsed = new URL(url);
    const path = parsed.pathname.substring(1);
    const parts = path.split('/');
    const fileName = parts.pop()!;
    const folder = parts.join('/');

    const thumbFileName = fileName
      .replace(/\.[^.]+$/, '-thumb.webp')
      .replace('-thumb-thumb', '-thumb');

    return `${parsed.origin}/${folder}/thumbnails/${thumbFileName}`;
  } catch (err) {
    console.error('getThumbnailUrlFromAvatar error:', err);
    return '';
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date().getTime();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 10) return 'vừa mới đăng';
  if (seconds < 60) return `${seconds} giây trước`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;

  const dateObj = new Date(date);
  const isThisYear = dateObj.getFullYear() === new Date().getFullYear();

  return dateObj.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    ...(isThisYear ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function normalizeLanguage(lang?: string): string {
  if (!lang) return 'text';

  const languageMap: Record<string, string> = {
    // JavaScript & TypeScript
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',

    // Web
    html: 'markup',
    xml: 'markup',
    svg: 'markup',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',

    // Backend
    python: 'python',
    py: 'python',
    java: 'java',
    c: 'c',
    'c++': 'cpp',
    cpp: 'cpp',
    'c#': 'csharp',
    csharp: 'csharp',
    cs: 'csharp',
    php: 'php',
    ruby: 'ruby',
    rb: 'ruby',
    go: 'go',
    golang: 'go',
    rust: 'rust',
    rs: 'rust',
    swift: 'swift',
    kotlin: 'kotlin',
    kt: 'kotlin',
    scala: 'scala',

    // Shell & Scripts
    bash: 'bash',
    sh: 'bash',
    shell: 'bash',
    powershell: 'powershell',
    ps1: 'powershell',
    batch: 'batch',
    cmd: 'batch',

    // Data & Config
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    csv: 'csv',
    ini: 'ini',

    // Database
    sql: 'sql',
    mysql: 'sql',
    postgresql: 'sql',
    postgres: 'sql',
    plsql: 'plsql',
    mongodb: 'javascript',

    // Markup & Documentation
    markdown: 'markdown',
    md: 'markdown',
    latex: 'latex',
    tex: 'latex',
    rst: 'rest',

    // Mobile
    dart: 'dart',
    objectivec: 'objectivec',
    'objective-c': 'objectivec',
    objc: 'objectivec',

    // Functional
    haskell: 'haskell',
    hs: 'haskell',
    elixir: 'elixir',
    ex: 'elixir',
    erlang: 'erlang',
    erl: 'erlang',
    clojure: 'clojure',
    clj: 'clojure',
    fsharp: 'fsharp',
    'f#': 'fsharp',
    fs: 'fsharp',
    ocaml: 'ocaml',
    ml: 'ocaml',

    // Other Popular
    r: 'r',
    matlab: 'matlab',
    julia: 'julia',
    perl: 'perl',
    pl: 'perl',
    lua: 'lua',
    groovy: 'groovy',
    vim: 'vim',
    makefile: 'makefile',
    make: 'makefile',
    dockerfile: 'docker',
    docker: 'docker',
    nginx: 'nginx',
    apache: 'apacheconf',

    // Query & Template
    graphql: 'graphql',
    gql: 'graphql',
    handlebars: 'handlebars',
    hbs: 'handlebars',
    mustache: 'mustache',
    pug: 'pug',
    jade: 'pug',
    ejs: 'ejs',

    // Misc
    diff: 'diff',
    git: 'git',
    regex: 'regex',
    wasm: 'wasm',
    webassembly: 'wasm',
    solidity: 'solidity',
    sol: 'solidity',
    prisma: 'prisma',

    text: 'text',
    plain: 'text',
    txt: 'text',
    other: 'text',
  };

  const normalized = lang.toLowerCase().trim();
  return languageMap[normalized] || 'text';
}
