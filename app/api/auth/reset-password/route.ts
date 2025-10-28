import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getApiTranslations } from '@/i18n/i18n';

// Validate password strength
function validatePassword(
  password: string,
  t: any,
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8)
    errors.push(t.auth.passwordReset.validation.minLength);
  if (!/[A-Z]/.test(password))
    errors.push(t.auth.passwordReset.validation.uppercase);
  if (!/[a-z]/.test(password))
    errors.push(t.auth.passwordReset.validation.lowercase);
  if (!/[0-9]/.test(password))
    errors.push(t.auth.passwordReset.validation.number);
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(t.auth.passwordReset.validation.specialChar);
  }

  return { valid: errors.length === 0, errors };
}

// GET - Verify reset token (before showing form)
export async function GET(request: Request) {
  const { t } = await getApiTranslations(request);

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: t.auth.passwordReset.tokenRequired },
        { status: 400 },
      );
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: t.auth.passwordReset.invalidOrExpired, expired: true },
        { status: 400 },
      );
    }

    // Return expiry time
    const expiresIn = Math.floor(
      (resetToken.expires.getTime() - Date.now()) / 1000,
    );

    return NextResponse.json({
      valid: true,
      expiresIn, // seconds remaining
      expiresAt: resetToken.expires.toISOString(),
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { error: t.auth.passwordReset.verifyFailed },
      { status: 500 },
    );
  }
}

// POST - Reset password
export async function POST(request: Request) {
  const { t } = await getApiTranslations(request);

  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: t.auth.passwordReset.tokenAndPasswordRequired },
        { status: 400 },
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password, t);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: t.auth.passwordReset.passwordTooWeak,
          details: passwordValidation.errors,
        },
        { status: 400 },
      );
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: t.auth.passwordReset.invalidOrExpired, expired: true },
        { status: 400 },
      );
    }

    // Check user status
    if (
      resetToken.user.status === 'BANNED' ||
      resetToken.user.status === 'SUSPENDED'
    ) {
      return NextResponse.json(
        { error: t.auth.passwordReset.accountNotActive },
        { status: 403 },
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Delete all reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    // Invalidate all sessions (optional - for security)
    await prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    });

    // Log activity
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await prisma.activityLog
      .create({
        data: {
          userId: resetToken.userId,
          action: 'PASSWORD_RESET_COMPLETED',
          entity: 'user',
          metadata: { email: resetToken.user.email },
          importance: 'WARNING',
          retentionDays: 90,
          expiresAt,
        },
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      message: t.auth.passwordReset.success,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: t.auth.passwordReset.resetFailed },
      { status: 500 },
    );
  }
}
