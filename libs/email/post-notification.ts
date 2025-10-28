import { notificationClient } from '../notification-client';

interface SendNewPostNotificationParams {
  subscribers: Array<{
    email: string;
    name: string;
    token: string;
  }>;
  authorName: string;
  postTitle: string;
  postExcerpt: string;
  postUrl: string;
  locale: string;
}

export async function sendNewPostNotification(
  params: SendNewPostNotificationParams,
) {
  const emails = params.subscribers.map(subscriber => ({
    to: subscriber.email,
    subject:
      params.locale === 'vi'
        ? `Bài viết mới từ ${params.authorName}`
        : `New post from ${params.authorName}`,
    template: 'new-post-notification',
    data: {
      subscriberName: subscriber.name,
      authorName: params.authorName,
      postTitle: params.postTitle,
      postExcerpt: params.postExcerpt,
      postUrl: params.postUrl,
      unsubscribeUrl: `${process.env.NEXTAUTH_URL}/unsubscribe?token=${subscriber.token}`,
      locale: params.locale,
    },
    priority: 3,
  }));

  return notificationClient.sendBulkEmails({ emails });
}
