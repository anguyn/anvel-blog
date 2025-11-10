import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/server/auth';
import {
  verify2FAToken,
  generateBackupCodes,
  hashBackupCode,
  encryptSecret,
} from '@/libs/server/2fa';
import { prisma } from '@/libs/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token || token.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pending2FASecret: true },
    });

    if (!user?.pending2FASecret) {
      return NextResponse.json(
        {
          error: 'No setup in progress. Please restart the 2FA setup process.',
        },
        { status: 400 },
      );
    }

    const secret = user.pending2FASecret;

    const isValid = verify2FAToken(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 },
      );
    }

    const backupCodesPlain = generateBackupCodes(10);
    const backupCodesHashed = await Promise.all(
      backupCodesPlain.map(code => hashBackupCode(code)),
    );

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY not configured');
    }

    const encryptedSecret = encryptSecret(secret, encryptionKey);

    const newSecurityStamp = crypto.randomBytes(32).toString('hex');

    await prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: encryptedSecret,
          pending2FASecret: null,
          securityStamp: newSecurityStamp,
        },
      });

      await tx.backupCode.createMany({
        data: backupCodesHashed.map(code => ({
          userId: session.user.id!,
          code,
          used: false,
        })),
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);

      await tx.activityLog.create({
        data: {
          userId: session.user.id!,
          action: '2FA_ENABLED',
          entity: 'security',
          importance: 'WARNING',
          retentionDays: 365,
          expiresAt,
        },
      });
    });

    return NextResponse.json({
      success: true,
      backupCodes: backupCodesPlain,
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 },
    );
  }
}
