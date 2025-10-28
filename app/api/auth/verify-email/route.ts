import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { sendWelcomeEmail } from '@/libs/email/welcome';
import { sendVerificationEmail } from '@/libs/email/verification';
import crypto from 'crypto';
import { getApiTranslations } from '@/i18n/i18n';

// GET - Verify email with token
export async function GET(request: Request) {
  const { t, locale } = await getApiTranslations(request);

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: t.auth.tokenRequired },
        { status: 400 },
      );
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: t.auth.tokenInvalid }, { status: 400 });
    }

    // Check if expired
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: t.auth.tokenExpired, expired: true },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: t.auth.userNotFound }, { status: 404 });
    }

    // Already verified
    if (user.emailVerified) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json({
        success: true,
        message: t.auth.alreadyVerified,
        alreadyVerified: true,
      });
    }

    // Verify user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        status: 'ACTIVE',
      },
    });

    // Delete token
    await prisma.verificationToken.delete({ where: { token } });

    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email,
        name: user.name || 'User',
        locale: user.language || 'vi',
        userId: user.id,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Log verification
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.activityLog
      .create({
        data: {
          userId: user.id,
          action: 'EMAIL_VERIFIED',
          entity: 'user',
          metadata: { email: user.email },
          importance: 'INFO',
          retentionDays: 30,
          expiresAt,
        },
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      message: t.auth.emailVerified,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: t.auth.verificationFailed },
      { status: 500 },
    );
  }
}

// POST - Resend verification email
export async function POST(request: Request) {
  const { t, locale } = await getApiTranslations(request);

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

    if (!user) {
      // Security: Don't reveal if email exists
      return NextResponse.json({
        success: true,
        message: t.auth.ifEmailExists,
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: t.auth.emailAlreadyVerified, alreadyVerified: true },
        { status: 400 },
      );
    }

    // Delete old tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: tokenExpiry,
      },
    });

    // Send email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/${user.language || 'vi'}/verify-email?token=${verificationToken}`;

    const emailResult = await sendVerificationEmail({
      email: user.email,
      name: user.name || 'User',
      verificationUrl,
      locale: user.language || 'vi',
      userId: user.id,
    });

    if (!emailResult.success && emailResult.error === 'rate_limit') {
      return NextResponse.json(
        {
          error: t.auth.rateLimit,
          message: t.auth.rateLimitMessage,
          retryAfter: emailResult.retryAfter,
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      success: true,
      message: t.auth.resendSuccess,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: t.auth.resendFailed }, { status: 500 });
  }
}
