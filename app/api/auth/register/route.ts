import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import crypto from 'crypto';
import { getApiTranslations } from '@/i18n/i18n';
import { sendVerificationEmail } from '@/libs/email/verification';

// Enhanced password validation
function validatePassword(
  password: string,
  t: any,
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8)
    errors.push(t.auth.passwordReset.validation.minLength);
  if (!/[A-Z]/.test(password))
    errors.push(t.auth.passwordReset.validation.uppercase);
  if (!/[a-z]/.test(password))
    errors.push(t.auth.passwordReset.validation.lowercase);
  if (!/[0-9]/.test(password))
    errors.push(t.auth.passwordReset.validation.number);
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(t.auth.passwordReset.validation.specialChar);
  }

  return { valid: errors.length === 0, errors };
}

export async function POST(request: Request) {
  const { t, locale } = await getApiTranslations(request);

  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: t.user.missingFields || 'All fields are required' },
        { status: 400 },
      );
    }

    // Validate email
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: t.user.invalidEmail || 'Invalid email format' },
        { status: 400 },
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password, t);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: t.user.passwordTooWeak || 'Password is too weak',
          details: passwordValidation.errors,
        },
        { status: 400 },
      );
    }

    // Validate name
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        {
          error:
            t.user.invalidName || 'Name must be between 2 and 50 characters',
        },
        { status: 400 },
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: t.user.userExists || 'Email already registered' },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate username
    let username = slugify(name, { lower: true, strict: true });
    let usernameExists = await prisma.user.findUnique({ where: { username } });
    let counter = 1;
    while (usernameExists) {
      username = `${name.toLowerCase().replace(/\s+/g, '')}${counter}`;
      usernameExists = await prisma.user.findUnique({ where: { username } });
      counter++;
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours

    // Get default role
    const defaultRole = await prisma.role.findUnique({
      where: { name: 'USER' },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        username,
        roleId: defaultRole?.id,
        status: 'PENDING', // User pending until email verified
        language: locale,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        createdAt: true,
      },
    });

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: tokenExpiry,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/${locale}/verify-email?token=${verificationToken}`;

    try {
      const emailResult = await sendVerificationEmail({
        email: user.email,
        name: user.name || 'User',
        verificationUrl,
        locale,
        userId: user.id,
      });

      if (!emailResult.success && emailResult.error === 'rate_limit') {
        // Email rate limited, but registration succeeded
        return NextResponse.json(
          {
            success: true,
            warning: 'rate_limit',
            message:
              t.user.registerSuccessButEmailRateLimit ||
              'Registration successful, but email sending is rate limited. Please try resending after a few minutes.',
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
            requiresVerification: true,
            retryAfter: emailResult.retryAfter,
          },
          { status: 201 },
        );
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Log registration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.activityLog
      .create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          entity: 'user',
          metadata: { email: user.email, method: 'credentials' },
          importance: 'INFO',
          retentionDays: 30,
          expiresAt,
        },
      })
      .catch(() => {});

    return NextResponse.json(
      {
        success: true,
        message:
          t.user.registerSuccess ||
          'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        requiresVerification: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: t.user.registerFailed || 'Registration failed' },
      { status: 500 },
    );
  }
}
