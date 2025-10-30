/**
 * Server-side Turnstile verification
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export async function verifyTurnstileToken(
  token: string,
  options?: {
    remoteip?: string;
    action?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  if (!token) {
    return {
      success: false,
      error: 'Turnstile token is required',
    };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error('[Turnstile] SECRET_KEY not configured');
    return {
      success: false,
      error: 'Turnstile configuration error',
    };
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
          remoteip: options?.remoteip,
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        }),
      },
    );

    const data: TurnstileVerifyResponse = await response.json();

    if (!data.success) {
      console.error('[Turnstile] Verification failed:', data['error-codes']);
      console.log('Data: ', data);
      return {
        success: false,
        error: 'Turnstile verification failed',
      };
    }

    // Optional: Validate action if provided
    if (options?.action && data.action !== options.action) {
      console.error(
        '[Turnstile] Action mismatch:',
        data.action,
        'vs',
        options.action,
      );
      return {
        success: false,
        error: 'Invalid Turnstile action',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[Turnstile] Verification error:', error);
    return {
      success: false,
      error: 'Turnstile verification failed',
    };
  }
}

/**
 * Helper để lấy IP từ request headers
 */
export function getClientIp(headers: Headers): string | undefined {
  // Cloudflare sets CF-Connecting-IP
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Fallback to X-Forwarded-For
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  // Fallback to X-Real-IP
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;

  return undefined;
}
