import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Anvel - Share & Discover Code Snippets',
    short_name: 'Anvel',
    description: 'Platform for developers to share and discover code snippets',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['developer', 'productivity', 'education'],
    shortcuts: [
      {
        name: 'Browse Snippets',
        url: '/snippets',
        description: 'Browse all code snippets',
      },
      {
        name: 'Search',
        url: '/search',
        description: 'Search for snippets',
      },
    ],
    lang: 'en',
    dir: 'ltr',
  };
}
