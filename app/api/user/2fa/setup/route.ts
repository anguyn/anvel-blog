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

    // Check if 2FA is already enabled
    if (session.user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 },
      );
    }

    // Generate 2FA secret and QR code
    const { secret, qrCode } = await generate2FASecret(
      session.user.email!,
      process.env.NEXT_PUBLIC_APP_NAME || 'Anvel',
    );

    // Store secret temporarily in user's pending2FASecret field
    // This will be moved to twoFactorSecret after verification
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pending2FASecret: secret, // Add this field to schema
      },
    });

    // Return QR code (don't return the secret to client for security)
    return NextResponse.json({
      qrCode,
      // Only return secret for manual entry display
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
