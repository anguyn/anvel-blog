import { notificationClient } from '../notification-client';

interface SendWelcomeEmailParams {
  email: string;
  name: string;
  locale: string;
  userId?: string;
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams) {
  try {
    const result = await notificationClient.sendEmail({
      to: params.email,
      template: 'welcome',
      data: {
        name: params.name,
        locale: params.locale,
      },
      priority: 5, // HIGH
      userId: params.userId,
      emailType: 'normal',
    });

    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: 'send_failed',
      message: error.message,
    };
  }
}
