import { notificationClient } from '../notification-client';

interface SendVerificationEmailParams {
  email: string;
  name: string;
  verificationUrl: string;
  locale: string;
  userId?: string;
}

export async function sendVerificationEmail(
  params: SendVerificationEmailParams,
) {
  try {
    const result = await notificationClient.sendEmail({
      to: params.email,
      template: 'verify-email',
      data: {
        name: params.name,
        verificationUrl: params.verificationUrl,
        locale: params.locale,
      },
      priority: 1, // CRITICAL
      userId: params.userId,
      emailType: 'verification',
    });

    return { success: true, data: result };
  } catch (error: any) {
    // Handle rate limit error (429)
    if (error.statusCode === 429) {
      return {
        success: false,
        error: 'rate_limit',
        message: error.message || 'Rate limit exceeded',
        retryAfter: error.response?.retryAfter,
        resetAt: error.response?.resetAt,
      };
    }

    // Handle other errors
    return {
      success: false,
      error: 'send_failed',
      message: error.message,
    };
  }
}
