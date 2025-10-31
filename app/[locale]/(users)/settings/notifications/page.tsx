import { MainLayout } from '@/components/layouts/main-layout';
import { auth } from '@/libs/server/auth';
import { redirect } from 'next/navigation';
import { SettingsLayout } from '@/components/blocks/pages/users/settings/settings-layout';
import { NotificationsSettingsForm } from '@/components/blocks/pages/users/settings/notification-settings-form';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/libs/server/rbac';
import { getTranslate, setStaticParamsLocale } from '@/i18n/server';
import { LocaleProps } from '@/i18n/config';

export const dynamic = 'force-dynamic';

export default async function NotificationsSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings/security`);
  }

  setStaticParamsLocale(locale as LocaleProps);
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const translations = {
    settings: t.settings.settings,
    profile: t.settings.profile,
    account: t.settings.account,
    security: t.settings.security,
    notifications: t.settings.notifications,
    appearance: t.settings.appearance,

    // Notifications specific
    notificationSettings: t.settings.notificationSettings,
    notificationDescription: t.settings.notificationDescription,

    emailNotifications: t.settings.emailNotifications,
    emailNotificationsDescription: t.settings.emailNotificationsDescription,

    pushNotifications: t.settings.pushNotifications,
    pushNotificationsDescription: t.settings.pushNotificationsDescription,

    // Email preferences
    newComment: t.settings.newComment,
    newCommentDescription: t.settings.newCommentDescription,
    commentReply: t.settings.commentReply,
    commentReplyDescription: t.settings.commentReplyDescription,
    newFollower: t.settings.newFollower,
    newFollowerDescription: t.settings.newFollowerDescription,
    mentionInComment: t.settings.mentionInComment,
    mentionInCommentDescription: t.settings.mentionInCommentDescription,

    // Marketing
    marketingEmails: t.settings.marketingEmails,
    marketingEmailsDescription: t.settings.marketingEmailsDescription,
    weeklyDigest: t.settings.weeklyDigest,
    weeklyDigestDescription: t.settings.weeklyDigestDescription,
    productUpdates: t.settings.productUpdates,
    productUpdatesDescription: t.settings.productUpdatesDescription,

    // Summary
    notificationSummary: t.settings.notificationSummary,
    notificationSummaryDescription: t.settings.notificationSummaryDescription,
    instantly: t.settings.instantly,
    daily: t.settings.daily,
    weekly: t.settings.weekly,
    never: t.settings.never,
  };

  return (
    <MainLayout locale={locale}>
      <SettingsLayout locale={locale} translations={translations}>
        <NotificationsSettingsForm user={user} translations={translations} />
      </SettingsLayout>
    </MainLayout>
  );
}
