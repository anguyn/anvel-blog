import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { PostService } from '@/libs/services/post.service';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.POST_PASSWORD_SECRET || 'your-secret-key-change-in-production',
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { password } = await request.json();
    const { slug } = await params; // Add await here

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 },
      );
    }

    // Find post by slug
    const post = await prisma.post.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        isPasswordProtected: true,
        passwordHash: true,
        visibility: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!post.isPasswordProtected || post.visibility !== 'PASSWORD') {
      return NextResponse.json(
        { error: 'Post is not password protected' },
        { status: 400 },
      );
    }

    // Verify password using existing PostService method
    const isValid = await PostService.verifyPostPassword(post.id, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 },
      );
    }

    // Create JWT token with post access
    const token = await new SignJWT({
      postId: post.id,
      slug: post.slug,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // Token expires in 24 hours
      .sign(JWT_SECRET);

    // Set httpOnly session cookie (expires when browser closes)
    const response = NextResponse.json({
      success: true,
      message: 'Password verified successfully',
    });

    response.cookies.set({
      name: `post_access_${post.slug}`,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // No maxAge or expires = session cookie (deleted when browser closes)
    });

    return response;
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
