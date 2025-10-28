import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/libs/server/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            snippets: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, image, username, currentPassword, newPassword } = body;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required' },
          { status: 400 },
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user?.password || '',
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 },
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name,
          bio,
          image,
          username,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          bio: true,
        },
      });

      return NextResponse.json(updatedUser);
    }

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 },
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        bio,
        image,
        username,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        bio: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user?.password ?? '',
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 400 },
      );
    }

    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 },
    );
  }
}
