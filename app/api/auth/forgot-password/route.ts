import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/libs/email/password-reset';
import { getApiTranslations } from '@/i18n/i18n';

export async function POST(request: Request) {
  const { t } = await getApiTranslations(request);

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: t.auth.emailRequired },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (
      !user ||
      !user.password ||
      user.status === 'BANNED' ||
      user.status === 'SUSPENDED'
    ) {
      return NextResponse.json({
        success: true,
        message: t.auth.passwordResetLinkSentIfExists,
      });
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const tokenExpiry = new Date();
    const expiryMinutes = parseInt(
      process.env.PASSWORD_RESET_EXPIRY_MINUTES || '3',
    );
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + expiryMinutes);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expires: tokenExpiry,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/${user.language || 'vi'}/reset-password?token=${resetToken}`;

    const emailResult = await sendPasswordResetEmail({
      subject: t.email.resetEmailSubject,
      email: user.email,
      name: user.name || 'User',
      resetUrl,
      locale: user.language || 'vi',
      userId: user.id,
    });

    if (!emailResult.success && emailResult.error === 'rate_limit') {
      console.log('Rate limit hit for password reset:', user.email);
    }

    const logExpiresAt = new Date();
    logExpiresAt.setDate(logExpiresAt.getDate() + 90);

    await prisma.activityLog
      .create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          entity: 'user',
          metadata: { email: user.email },
          importance: 'WARNING',
          retentionDays: 90,
          expiresAt: logExpiresAt,
        },
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      message: t.auth.passwordResetLinkSentIfExists,
      expiresIn: expiryMinutes * 60,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: t.auth.passwordResetFailed },
      { status: 500 },
    );
  }
}
