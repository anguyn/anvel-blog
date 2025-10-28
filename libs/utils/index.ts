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
