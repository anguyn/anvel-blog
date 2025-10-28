interface SendEmailParams {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  template?: string;
  data?: any;
  priority?: number;
  userId?: string;
  emailType?: 'verification' | 'password_reset' | 'normal';
}

interface SendBulkEmailParams {
  emails: SendEmailParams[];
}

interface ApiErrorResponse {
  error: string;
  message?: string;
  retryAfter?: number;
  resetAt?: string;
  details?: any;
}

class NotificationClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl =
      process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001';
    this.apiKey = process.env.NOTIFICATION_API_KEY || '';

    if (!this.apiKey) {
      console.warn(
        '⚠️ NOTIFICATION_API_KEY not set. Notification service calls will fail.',
      );
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Create error with response data
        const error = new Error(
          data.message || data.error || 'Request failed',
        ) as any;
        error.statusCode = response.status;
        error.response = data;
        throw error;
      }

      return data;
    } catch (error: any) {
      // Network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('❌ Notification service unreachable:', this.baseUrl);
        const err = new Error('Notification service is unreachable') as any;
        err.statusCode = 503;
        throw err;
      }

      throw error;
    }
  }

  async sendEmail(params: SendEmailParams) {
    try {
      const res = await this.request('/api/email/send', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return res;
    } catch (error: any) {
      console.error('Failed to send email:', error.message);

      // Re-throw with structured error
      const err = new Error(error.message) as any;
      err.statusCode = error.statusCode;
      err.response = error.response;
      throw err;
    }
  }

  async sendBulkEmails(params: SendBulkEmailParams) {
    try {
      return await this.request('/api/email/send-bulk', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch (error: any) {
      console.error('Failed to send bulk emails:', error.message);

      const err = new Error(error.message) as any;
      err.statusCode = error.statusCode;
      err.response = error.response;
      throw err;
    }
  }

  async sendNotification(params: {
    userId: string;
    type:
      | 'NEW_POST'
      | 'NEW_COMMENT'
      | 'COMMENT_REPLY'
      | 'NEW_FOLLOWER'
      | 'POST_LIKED'
      | 'MENTION'
      | 'SYSTEM';
    title: string;
    message: string;
    link?: string;
    data?: any;
  }) {
    try {
      return await this.request('/api/notification/send', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch (error: any) {
      console.error('Failed to send notification:', error.message);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unhealthy' };
    }
  }
}

export const notificationClient = new NotificationClient();
