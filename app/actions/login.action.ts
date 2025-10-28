'use server';

import { signIn, signOut } from '@/libs/server/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { getActionTranslations } from '@/i18n/i18n';
import { prisma } from '@/libs/prisma';
import bcrypt from 'bcryptjs';

// ============================================
// LOGIN ACTION
// ============================================
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional(),
});

export async function authenticate(formData: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) {
  const { t, locale } = await getActionTranslations();

  try {
    const validatedFields = loginSchema.safeParse(formData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: t.common.invalidFields,
      };
    }

    const { email, password, rememberMe } = validatedFields.data;

    await signIn('credentials', {
      email,
      password,
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
      console.log('Output: ', error.type);
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            error: t.login.invalidCredentials,
          };
        // case 'AccessDenied':
        //   return {
        //     success: false,
        //     error: t.common.accessDenied,
        //   };
        case 'CallbackRouteError':
          // Check error message for specific errors
          const message = error.message || '';
          if (message.includes('banned')) {
            return {
              success: false,
              error: 'Your account has been banned',
              code: 'BANNED',
            };
          }
          if (message.includes('suspended')) {
            return {
              success: false,
              error: 'Your account has been suspended',
              code: 'SUSPENDED',
            };
          }
          if (message.includes('not verified')) {
            return {
              success: false,
              error: 'Please verify your email first',
              code: 'UNVERIFIED',
            };
          }
          return { success: false, error: 'Invalid email or password' };
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
