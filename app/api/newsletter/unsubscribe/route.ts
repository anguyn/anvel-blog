import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = unsubscribeSchema.parse(body);

    const whereClause: any = {
      email: email.toLowerCase(),
      isActive: true,
    };

    if (token) {
      whereClause.token = token;
    }

    const subscription = await prisma.emailSubscription.findFirst({
      where: whereClause,
    });

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active subscription found for this email address',
        },
        { status: 404 },
      );
    }

    await prisma.emailSubscription.update({
      where: { id: subscription.id },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    // TODO: Send unsubscribe confirmation email

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await prisma.activityLog
      .create({
        data: {
          action: 'NEWSLETTER_UNSUBSCRIBE',
          entity: 'newsletter',
          entityId: subscription.id,
          metadata: { email: subscription.email },
          importance: 'INFO',
          retentionDays: 90,
          expiresAt,
        },
      })
      .catch(console.error);

    return NextResponse.json(
      {
        success: true,
        message: 'You have been successfully unsubscribed from our newsletter.',
      },
      { status: 200 },
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

    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500 },
    );
  }
}
