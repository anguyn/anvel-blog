import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { z } from 'zod';
import { auth } from '@/libs/server/auth';
import { getApiTranslations } from '@/i18n/i18n';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000),
});

export async function POST(request: NextRequest) {
  const { t: translate } = await getApiTranslations(request);
  const t = translate.api.errors;

  try {
    const body = await request.json();
    const validated = contactSchema.parse(body);

    const session = await auth();
    const userId = session?.user?.id || null;

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const recentMessage = await prisma.contactMessage.findFirst({
      where: {
        email: validated.email.toLowerCase(),
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      },
    });

    if (recentMessage) {
      return NextResponse.json(
        {
          success: false,
          message: t.waitContact,
        },
        { status: 429 },
      );
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        subject: validated.subject,
        message: validated.message,
        userId,
        ipAddress,
        userAgent,
        status: 'UNREAD',
      },
    });

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to user

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await prisma.activityLog
      .create({
        data: {
          userId,
          action: 'CONTACT_FORM_SUBMIT',
          entity: 'contact',
          entityId: contactMessage.id,
          metadata: {
            email: contactMessage.email,
            subject: contactMessage.subject,
          },
          importance: 'INFO',
          retentionDays: 90,
          expiresAt,
        },
      })
      .catch(console.error);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for contacting us! We'll get back to you soon.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please check your input',
          errors: (error as z.ZodError).message,
        },
        { status: 400 },
      );
    }

    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500 },
    );
  }
}
