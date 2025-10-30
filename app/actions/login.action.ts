'use server';

import { signIn, signOut } from '@/libs/server/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { getActionTranslations } from '@/i18n/i18n';
import {
  getClientIp,
  verifyTurnstileToken,
} from '@/components/blocks/turnstile/verify-turnstile';
import { headers } from 'next/headers';

// ============================================
// LOGIN ACTION WITH 2FA SUPPORT
// ============================================
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  token2FA: z.string().optional(),
  backupCode: z.string().optional(),
  rememberMe: z.boolean().optional(),
  turnstileToken: z.string(),
});

interface AuthenticateParams {
  email: string;
  password: string;
  token2FA?: string;
  backupCode?: string;
  rememberMe?: boolean;
  turnstileToken: string;
}

interface AuthenticateResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export async function authenticate(
  formData: AuthenticateParams,
): Promise<AuthenticateResult> {
  const { t, locale } = await getActionTranslations();

  try {
    const validatedFields = loginSchema.safeParse(formData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: t.common.invalidFields,
      };
    }

    const {
      email,
      password,
      token2FA,
      backupCode,
      rememberMe,
      turnstileToken,
    } = validatedFields.data;

    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    const turnstileResult = await verifyTurnstileToken(turnstileToken, {
      remoteip: clientIp,
      action: 'login',
    });

    if (!turnstileResult.success) {
      console.error('[Auth] Turnstile verification failed');
      return {
        success: false,
        error: t.login.turnstileError,
        code: 'TURNSTILE_FAILED',
      };
    }

    await signIn('credentials', {
      email,
      password,
      token2FA: token2FA || undefined,
      backupCode: backupCode || undefined,
      rememberMe: rememberMe?.toString(),
      redirect: false,
    });

    return {
      success: true,
      message: t.login.loginSuccess,
    };
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof AuthError) {
      console.log('Auth Error Type:', error.type);
      console.log('Auth Error Message:', error.message);

      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            error: t.login.invalidCredentials,
          };

        case 'CallbackRouteError': {
          // Check error message for specific errors
          const message = error.message || '';
          const cause = (error as any).cause?.err?.message || '';

          // Check cause first (more reliable)
          if (cause === 'BANNED') {
            return {
              success: false,
              error: t.login.accountBanned || 'Your account has been banned',
              code: 'BANNED',
            };
          }

          if (cause === 'SUSPENDED') {
            return {
              success: false,
              error:
                t.login.accountSuspended || 'Your account has been suspended',
              code: 'SUSPENDED',
            };
          }

          if (cause === 'UNVERIFIED') {
            return {
              success: false,
              error:
                t.login.accountNotVerified || 'Please verify your email first',
              code: 'UNVERIFIED',
            };
          }

          if (cause === '2FA_REQUIRED') {
            return {
              success: false,
              error:
                t.login.twoFactorRequired ||
                'Two-factor authentication is required',
              code: '2FA_REQUIRED',
            };
          }

          if (cause === 'INVALID_2FA') {
            return {
              success: false,
              error:
                t.login.invalid2FACode || 'Invalid 2FA code. Please try again.',
              code: 'INVALID_2FA',
            };
          }

          if (
            cause === '2FA_CONFIG_ERROR' ||
            cause === '2FA_VERIFICATION_ERROR'
          ) {
            return {
              success: false,
              error:
                t.login.twoFactorError ||
                '2FA verification error. Please try again later.',
              code: '2FA_ERROR',
            };
          }

          // Fallback to checking message
          if (message.includes('banned')) {
            return {
              success: false,
              error: t.login.accountBanned || 'Your account has been banned',
              code: 'BANNED',
            };
          }

          if (message.includes('suspended')) {
            return {
              success: false,
              error:
                t.login.accountSuspended || 'Your account has been suspended',
              code: 'SUSPENDED',
            };
          }

          if (
            message.includes('not verified') ||
            message.includes('unverified')
          ) {
            return {
              success: false,
              error:
                t.login.accountNotVerified || 'Please verify your email first',
              code: 'UNVERIFIED',
            };
          }

          if (message.includes('2FA') || message.includes('two-factor')) {
            return {
              success: false,
              error:
                t.login.twoFactorRequired ||
                'Two-factor authentication is required',
              code: '2FA_REQUIRED',
            };
          }

          return {
            success: false,
            error: t.login.invalidCredentials || 'Invalid email or password',
          };
        }

        default:
          return {
            success: false,
            error: t.common.somethingWrong,
          };
      }
    }

    return {
      success: false,
      error: t.common.serverError,
    };
  }
}

// ============================================
// LOGOUT ACTION
// ============================================
export async function logoutAction() {
  const { t } = await getActionTranslations();

  try {
    await signOut({ redirect: false });
    return {
      success: true,
      message: t.auth.logoutSuccess || 'Logged out successfully',
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: t.common.serverError,
    };
  }
}
