import { MetadataRoute } from 'next';

interface Snippet {
  slug: string;
  updatedAt: string;
}

async function getSnippets(): Promise<Snippet[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/snippets?limit=10000`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const snippets = await getSnippets();

  const locales = ['en', 'vi'];
  const routes = ['', '/snippets', '/search', '/tags', '/favorites'];

  const staticPages = locales.flatMap(locale =>
    routes.map(route => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? ('daily' as const) : ('weekly' as const),
      priority: route === '' ? 1 : route === '/snippets' ? 0.9 : 0.7,
      alternates: {
        languages: {
          en: `${baseUrl}/en${route}`,
          vi: `${baseUrl}/vi${route}`,
        },
      },
    })),
  );

  const snippetPages = locales.flatMap(locale =>
    snippets.map(snippet => ({
      url: `${baseUrl}/${locale}/snippets/${snippet.slug}`,
      lastModified: new Date(snippet.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/en/snippets/${snippet.slug}`,
          vi: `${baseUrl}/vi/snippets/${snippet.slug}`,
        },
      },
    })),
  );

  return [...staticPages, ...snippetPages];
}
