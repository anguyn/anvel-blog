import { MainLayout } from '@/components/layouts/main-layout';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { Metadata } from 'next';
import { auth } from '@/libs/server/auth';
import { LocaleProps } from '@/i18n/config';
import { redirect } from 'next/navigation';
import { SettingsLayout } from '@/components/blocks/pages/users/settings/settings-layout';
import { ProfileSettingsForm } from '@/components/blocks/pages/users/settings/profile-settings-form';

export const dynamic = 'force-dynamic';
export const generateStaticParams = getStaticParams;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  return {
    title: t.settings.pageTitle || 'Settings',
    description: t.settings.pageDescription || 'Manage your account settings',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  console.log('User page: ', session?.user);

  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings`);
  }

  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const translations = {
    settings: t.settings.settings || 'Settings',
    profile: t.settings.profile || 'Profile',
    account: t.settings.account || 'Account',
    security: t.settings.security || 'Security',
    notifications: t.settings.notifications || 'Notifications',
    appearance: t.settings.appearance || 'Appearance',

    profileInfo: t.settings.profileInfo || 'Profile Information',
    profileDescription:
      t.settings.profileDescription || 'Update your profile information',
    name: t.settings.name || 'Name',
    username: t.settings.username || 'Username',
    email: t.settings.email || 'Email',
    bio: t.settings.bio || 'Bio',
    bioPlaceholder: t.settings.bioPlaceholder || 'Tell us about yourself',
    location: t.settings.location || 'Location',
    website: t.settings.website || 'Website',
    twitter: t.settings.twitter || 'Twitter Username',
    github: t.settings.github || 'GitHub Username',
    linkedin: t.settings.linkedin || 'LinkedIn Username',

    save: t.settings.save || 'Save Changes',
    saving: t.settings.saving || 'Saving...',
    cancel: t.settings.cancel || 'Cancel',

    saveSuccess: t.settings.saveSuccess || 'Settings saved successfully',
    saveError: t.settings.saveError || 'Failed to save settings',
    selectImageFile:
      t.settings.selectImageFile || 'Please select an image file',
    imageSizeLimit:
      t.settings.imageSizeLimit || 'Image size must be less than 5MB',
    avatarUpdated: t.settings.avatarUpdated || 'Avatar updated successfully',
    avatarUploadError:
      t.settings.avatarUploadError || 'Avatar cannot be uploaded',
    noAvatarToDelete: t.settings.noAvatarToDelete || 'No avatar to delete',
    confirmDeleteAvatar:
      t.settings.confirmDeleteAvatar ||
      'Are you sure you want to delete the avatar?',
    avatarDeleted: t.settings.avatarDeleted || 'Avatar successfully deleted',
    avatarDeleteError:
      t.settings.avatarDeleteError || 'Avatar cannot be deleted',
    profilePicture: t.settings.profilePicture || 'Avatar',
    chooseImage: t.settings.chooseImage || 'Choose an image',
    uploading: t.settings.uploading || 'Uploading...',
    upload: t.settings.upload || 'Uploading',
    deleting: t.settings.deleting || 'Deleting...',
    deleteAvatar: t.settings.deleteAvatar || 'Delete image',
    imageRequirements:
      t.settings.imageRequirements ||
      'JPG, PNG, or GIF. Maximum 5MB. Will be converted to WebP.',
    clearSelection: t.settings.clearSelection || 'Clear selection',
    confirmDeleteAvatarTitle:
      t.settings.confirmDeleteAvatarTitle || 'Delete avatar?',
    delete: t.settings.delete || 'Delete',
    processing: t.settings.processing || 'Processing...',
  };

  return (
    <MainLayout locale={locale}>
      <SettingsLayout locale={locale} translations={translations}>
        <ProfileSettingsForm user={session.user} translations={translations} />
      </SettingsLayout>
    </MainLayout>
  );
}
