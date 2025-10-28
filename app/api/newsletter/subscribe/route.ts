import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.string().optional().default('en'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale } = subscribeSchema.parse(body);

    // Check if already subscribed
    const existing = await prisma.emailSubscription.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'This email is already subscribed' },
        { status: 400 },
      );
    }

    // Get admin user (author for newsletters)
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          name: 'ADMIN',
        },
      },
    });

    if (!adminUser) {
      console.error('No admin user found for newsletter subscription');
      return NextResponse.json(
        { success: false, message: 'Service temporarily unavailable' },
        { status: 500 },
      );
    }

    // Create subscription
    const subscription = await prisma.emailSubscription.create({
      data: {
        email: email.toLowerCase(),
        authorId: adminUser.id,
        isActive: true,
        frequency: 'WEEKLY',
      },
    });

    // TODO: Send confirmation email
    // await sendNewsletterConfirmationEmail({
    //   email: subscription.email,
    //   token: subscription.token,
    //   locale,
    // });

    // Log activity
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await prisma.activityLog
      .create({
        data: {
          action: 'NEWSLETTER_SUBSCRIBE',
          entity: 'newsletter',
          entityId: subscription.id,
          metadata: { email: subscription.email, locale },
          importance: 'INFO',
          retentionDays: 90,
          expiresAt,
        },
      })
      .catch(console.error);

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed! Please check your email to confirm.',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email address',
          errors: error.message,
        },
        { status: 400 },
      );
    }

    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500 },
    );
  }
}
