import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';
import { TagsRenderBlock } from '@/components/blocks/pages/tags/render';
import { Tag } from '@/types';

export const generateStaticParams = getStaticParams;

async function getTags(): Promise<Tag[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tags`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return [];
  }
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  return {
    title: t.tags.title || 'Browse Tags',
    description:
      t.tags.pageDescription || 'Explore code snippets by tags and topics',
    keywords: 'tags, topics, programming languages, browse',
  };
}

export default async function TagsPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { locale } = params;

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const allTags = await getTags();
  const topicTags = allTags.filter(t => t.type === 'TOPIC');
  const languageTags = allTags.filter(t => t.type === 'LANGUAGE');

  const normalizeParam = (
    param: string | string[] | undefined,
  ): string | undefined => {
    if (Array.isArray(param)) return param[0];
    return param;
  };

  const tagsTranslations = {
    browseByTags: t.tags.browseByTags || 'Browse by Tags',
    description:
      t.tags.description ||
      'Discover code snippets organized by programming languages and topics',
    topics: t.tags.topics || 'Topics',
    languages: t.tags.languages || 'Languages',
    snippet: t.tags.snippet || 'snippet',
    snippets: t.tags.snippets || 'snippets',
    noTopicsFound: t.tags.noTopicsFound || 'No topics found',
    noLanguagesFound: t.tags.noLanguagesFound || 'No languages found',
  };

  return (
    <MainLayout locale={locale as string}>
      <TagsRenderBlock
        locale={locale as string}
        translations={tagsTranslations}
        topicTags={topicTags}
        languageTags={languageTags}
        searchParams={{
          type: normalizeParam(searchParams?.type),
        }}
      />
    </MainLayout>
  );
}
