import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { decryptSecret, verify2FAToken } from '@/libs/server/2fa';
import { requireAuth } from '@/libs/server/auth';
import { getApiTranslations } from '@/i18n/i18n';

export async function POST(request: Request) {
  const { t } = await getApiTranslations(request);

  try {
    const session = await requireAuth();
    const { password, token } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: t.api.twofa.passwordRequired },
        { status: 400 },
      );
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: t.api.twofa.invalidPassword },
        { status: 401 },
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: t.api.twofa.twoFactorNotEnabled },
        { status: 400 },
      );
    }

    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const secret = decryptSecret(user.twoFactorSecret, encryptionKey);
    const isValidToken = verify2FAToken(token, secret);

    if (!isValidToken) {
      return NextResponse.json(
        { error: t.api.twofa.invalid2FACode },
        { status: 401 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    await prisma.backupCode.deleteMany({
      where: { userId: session.user.id },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 180);

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: '2FA_DISABLED',
        entity: 'user',
        entityId: session.user.id,
        importance: 'WARNING',
        retentionDays: 180,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: t.api.twofa.twoFactorDisabledSuccess,
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: t.api.twofa.twoFactorDisableFailed },
      { status: 500 },
    );
  }
}
