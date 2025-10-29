import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getCurrentUser } from '@/libs/server/rbac';
import { validatePassword } from '@/libs/helpers/password.validator';
import { getApiTranslations } from '@/i18n/i18n';

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { t } = await getApiTranslations(req);
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error:
            t.user.missingFields ||
            'Current password and new password are required',
        },
        { status: 400 },
      );
    }

    const passwordValidation = validatePassword(newPassword, t);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: t.user.passwordTooWeak || 'Password is too weak',
          details: passwordValidation.errors,
          strength: passwordValidation.strength,
          score: passwordValidation.score,
        },
        { status: 400 },
      );
    }

    // Check if password is strong enough (at least medium)
    if (passwordValidation.strength === 'weak') {
      return NextResponse.json(
        {
          error:
            t.user.passwordTooWeak ||
            'Password is too weak. Please choose a stronger password.',
          strength: passwordValidation.strength,
          score: passwordValidation.score,
        },
        { status: 400 },
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, password: true, email: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          error:
            t.auth.oauthPasswordError ||
            'Password update not available for OAuth users',
        },
        { status: 400 },
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        {
          error:
            t.auth.invalidCurrentPassword || 'Current password is incorrect',
        },
        { status: 400 },
      );
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        {
          error:
            t.auth.samePassword ||
            'New password must be different from current password',
        },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Generate new security stamp to invalidate all other sessions
    const newSecurityStamp = crypto.randomBytes(32).toString('hex');

    // Update password and security stamp
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        password: hashedPassword,
        securityStamp: newSecurityStamp,
      },
    });

    // Log activity
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    await prisma.activityLog
      .create({
        data: {
          userId: currentUser.id,
          action: 'PASSWORD_CHANGED',
          entity: 'user',
          entityId: currentUser.id,
          importance: 'WARNING',
          retentionDays: 365,
          expiresAt,
        },
      })
      .catch(() => {});

    // TODO: Send email notification about password change
    // await sendPasswordChangedEmail({ email: user.email, ... });

    return NextResponse.json({
      success: true,
      message: t.auth.passwordUpdated || 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 },
    );
  }
}
