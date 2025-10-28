import { notificationClient } from '../notification-client';

interface SendPasswordResetEmailParams {
  email: string;
  name: string;
  resetUrl: string;
  locale: string;
  userId?: string;
}

export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams,
) {
  try {
    const result = await notificationClient.sendEmail({
      to: params.email,
      template: 'password-reset',
      data: {
        name: params.name,
        resetUrl: params.resetUrl,
        locale: params.locale,
      },
      priority: 1, // CRITICAL
      userId: params.userId,
      emailType: 'password_reset',
    });

    return { success: true, data: result };
  } catch (error: any) {
    if (error.statusCode === 429) {
      return {
        success: false,
        error: 'rate_limit',
        message: error.message || 'Rate limit exceeded',
        retryAfter: error.response?.retryAfter,
        resetAt: error.response?.resetAt,
      };
    }

    return {
      success: false,
      error: 'send_failed',
      message: error.message,
    };
  }
}
