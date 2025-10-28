import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { Metadata } from 'next';
import { UserProfileRenderBlock } from '@/components/blocks/pages/users/profile/render';
import { User, Snippet } from '@/types';
import { notFound } from 'next/navigation';
import { auth } from '@/libs/server/auth';
import { LocaleProps } from '@/i18n/config';

export const dynamic = 'force-dynamic';

export const generateStaticParams = getStaticParams;

async function getUserProfile(username: string): Promise<User | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/users/${username}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}

async function getUserSnippets(username: string): Promise<Snippet[]> {
  try {
    const user = await getUserProfile(username);
    if (!user) return [];

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/snippets?userId=${user.id}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.snippets || [];
  } catch (error) {
    console.error('Failed to fetch user snippets:', error);
    return [];
  }
}

interface UserProfilePageProps {
  params: Promise<{
    locale: string;
    username: string;
  }>;
}

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const user = await getUserProfile(username);

  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  if (!user) {
    return {
      title: t.userProfile.notFound || 'User Not Found',
    };
  }

  return {
    title: `${user.name || user.username} - ${t.userProfile.profile || 'Profile'}`,
    description:
      user.bio ||
      `${t.userProfile.viewProfile || 'View'} ${user.name || user.username}'s ${t.userProfile.codeSnippetsAndProfile || 'code snippets and profile'}`,
  };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { locale, username } = await params;

  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const [user, snippets, session] = await Promise.all([
    getUserProfile(username),
    getUserSnippets(username),
    auth(),
  ]);

  if (!user) {
    notFound();
  }

  const isOwner = session?.user?.id === user.id;

  const userProfileTranslations = {
    editProfile: t.userProfile.editProfile || 'Edit Profile',
    joined: t.userProfile.joined || 'Joined',
    snippet: t.userProfile.snippet || 'snippet',
    snippets: t.userProfile.snippets || 'snippets',
    snippetsLabel: t.userProfile.snippetsLabel || 'Snippets',
    views: t.userProfile.views || 'Views',
    favorites: t.userProfile.favorites || 'Favorites',
    languages: t.userProfile.languages || 'Languages',
    topLanguages: t.userProfile.topLanguages || 'Top Languages',
    mySnippets: t.userProfile.mySnippets || 'My Snippets',
    publicSnippets: t.userProfile.publicSnippets || 'Public Snippets',
    createNew: t.userProfile.createNew || 'Create New',
    noSnippetsYet:
      t.userProfile.noSnippetsYet || "You haven't created any snippets yet",
    noPublicSnippets:
      t.userProfile.noPublicSnippets || 'No public snippets available',
  };

  return (
    <MainLayout locale={locale as string}>
      <UserProfileRenderBlock
        locale={locale as string}
        translations={userProfileTranslations}
        user={user}
        snippets={snippets}
        isOwner={isOwner}
      />
    </MainLayout>
  );
}
