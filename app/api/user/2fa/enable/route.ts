import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { requireAuth } from '@/libs/server/auth';
import { verify2FAToken, decryptSecret } from '@/libs/server/2fa';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const { token } = await req.json();

    if (!token || token.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 },
      );
    }

    // Get encrypted secret
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Please setup 2FA first' },
        { status: 400 },
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 },
      );
    }

    // Decrypt and verify token
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const secret = decryptSecret(user.twoFactorSecret, encryptionKey);

    const isValid = verify2FAToken(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 },
      );
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        securityStamp: crypto.randomUUID(), // Force re-login
      },
    });

    // Log activity
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 180);

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: '2FA_ENABLED',
        entity: 'user',
        entityId: session.user.id,
        importance: 'WARNING',
        retentionDays: 180,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully. Please log in again.',
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 },
    );
  }
}
