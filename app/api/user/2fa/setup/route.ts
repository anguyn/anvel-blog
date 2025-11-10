import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/server/auth';
import { generate2FASecret } from '@/libs/server/2fa';
import { prisma } from '@/libs/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 },
      );
    }

    const { secret, qrCode } = await generate2FASecret(
      session.user.email!,
      process.env.NEXT_PUBLIC_APP_NAME || 'Anvel',
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pending2FASecret: secret,
      },
    });

    return NextResponse.json({
      qrCode,
      secretForDisplay: secret,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to generate 2FA setup' },
      { status: 500 },
    );
  }
}
