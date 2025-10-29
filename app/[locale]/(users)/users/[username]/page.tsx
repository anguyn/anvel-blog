import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { Metadata } from 'next';
import { User, Snippet } from '@/types';
import { notFound } from 'next/navigation';
import { auth } from '@/libs/server/auth';
import { LocaleProps } from '@/i18n/config';
import { UserProfileHeader } from '@/components/blocks/pages/users/profile/profile-header';
import { UserProfileStats } from '@/components/blocks/pages/users/profile/profile-stats';
import { UserTopLanguages } from '@/components/blocks/pages/users/profile/top-languages';
import { UserSnippetsSection } from '@/components/blocks/pages/users/profile/snippets-section';

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
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const snippets = await getUserSnippets(username);
  const publicSnippets = snippets.filter(s => s.isPublic);

  return {
    title: `${user.name || user.username} - ${t.userProfile.profile || 'Profile'}`,
    description:
      user.bio ||
      `${t.userProfile.viewProfile || 'View'} ${user.name || user.username}'s ${publicSnippets.length} ${t.userProfile.codeSnippetsAndProfile || 'code snippets and profile'}`,
    openGraph: {
      title: `${user.name || user.username} - ${t.userProfile.profile || 'Profile'}`,
      description: user.bio || `${user.name || user.username}'s profile`,
      images: user.image ? [{ url: user.image }] : [],
      type: 'profile',
      username: user.username || undefined,
    },
    twitter: {
      card: 'summary',
      title: `${user.name || user.username} - ${t.userProfile.profile || 'Profile'}`,
      description: user.bio || `${user.name || user.username}'s profile`,
      images: user.image ? [user.image] : [],
    },
    alternates: {
      canonical: `/${locale}/users/${username}`,
      languages: {
        en: `/en/users/${username}`,
        vi: `/vi/users/${username}`,
      },
    },
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
  const publicSnippets = snippets.filter(s => s.isPublic);
  const displaySnippets = isOwner ? snippets : publicSnippets;

  const translations = {
    editProfile: t.userProfile.editProfile || 'Edit Profile',
    settings: t.userProfile.settings || 'Settings',
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

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: user.name || user.username,
      alternateName: user.username,
      description: user.bio,
      image: user.image,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/users/${username}`,
      sameAs: [
        user.website,
        user.github && `https://github.com/${user.github}`,
        user.twitter && `https://twitter.com/${user.twitter}`,
        user.linkedin && `https://linkedin.com/in/${user.linkedin}`,
      ].filter(Boolean),
    },
  };

  return (
    <MainLayout locale={locale as string}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto space-y-8">
          {/* Server Component - Header */}
          <UserProfileHeader
            user={user}
            isOwner={isOwner}
            locale={locale}
            translations={translations}
          />

          {/* Server Component - Stats */}
          <UserProfileStats
            snippetsCount={displaySnippets.length}
            viewsCount={displaySnippets.reduce(
              (sum, s) => sum + s.viewCount,
              0,
            )}
            favoritesCount={displaySnippets.reduce(
              (sum, s) => sum + (s._count?.favorites || 0),
              0,
            )}
            languagesCount={
              Object.keys(
                displaySnippets.reduce(
                  (acc, snippet) => {
                    acc[snippet.language.name] = true;
                    return acc;
                  },
                  {} as Record<string, boolean>,
                ),
              ).length
            }
            translations={translations}
          />

          {/* Server Component - Top Languages */}
          {displaySnippets.length > 0 && (
            <UserTopLanguages
              snippets={displaySnippets}
              translations={translations}
            />
          )}

          {/* Client Component - Snippets with interaction */}
          <UserSnippetsSection
            snippets={displaySnippets}
            isOwner={isOwner}
            locale={locale}
            translations={translations}
          />
        </div>
      </div>
    </MainLayout>
  );
}
