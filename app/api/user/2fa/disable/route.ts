import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { decryptSecret, verify2FAToken } from '@/libs/server/2fa';
import { requireAuth } from '@/libs/server/auth';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const { password, token } = await req.json();

    // Verify password first
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user?.password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Verify 2FA token
    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 },
      );
    }

    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const secret = decryptSecret(user.twoFactorSecret, encryptionKey);
    const isValidToken = verify2FAToken(token, secret);

    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Delete backup codes
    await prisma.backupCode.deleteMany({
      where: { userId: session.user.id },
    });

    // Log activity
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
      message: '2FA disabled successfully',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 },
    );
  }
}
