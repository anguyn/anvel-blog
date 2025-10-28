import { MainLayout } from '@/components/layouts/main-layout';
import { auth } from '@/libs/server/auth';
import { prisma } from '@/libs/prisma';
import { redirect } from 'next/navigation';
import { getTranslate, setStaticParamsLocale } from '@/i18n/server';
import { SnippetCreateBlock } from '@/components/blocks/pages/snippets/create/render';
import { PageProps } from '@/types/global';
import { Metadata } from 'next';

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params;

  setStaticParamsLocale(locale);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  return {
    title: t.snippets.createTitle,
    description: t.snippets.createDescription,
    openGraph: {
      title: t.snippets.createTitle,
      description: t.snippets.createDescription || undefined,
      type: 'article',
    },
  };
}

export default async function NewSnippetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/snippets/new`);
  }

  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const languages = await prisma.language.findMany({
    where: { isActive: true },
    orderBy: { popularity: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
    },
  });

  const snippetTranslations = {
    title: t.snippets.createTitle,
    description: t.snippets.createDescription,
  };

  return (
    <MainLayout locale={locale}>
      <SnippetCreateBlock
        locale={locale}
        languages={languages}
        translations={snippetTranslations}
      />
    </MainLayout>
  );
}
