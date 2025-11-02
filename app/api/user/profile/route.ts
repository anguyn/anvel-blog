import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/libs/server/auth';
import { prisma } from '@/libs/prisma';
import { uploadAvatar, deleteAvatar } from '@/libs/server/r2';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('avatar') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 },
        );
      }

      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File must be an image' },
          { status: 400 },
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 5MB' },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { image: true },
      });

      if (currentUser?.image && currentUser.image.includes('r2.dev')) {
        try {
          const url = new URL(currentUser.image);
          const key = url.pathname.substring(1);
          await deleteAvatar(key);
        } catch (error) {
          console.error('Failed to delete old avatar:', error);
        }
      }

      const uploadResult = await uploadAvatar(
        buffer,
        session.user.id,
        file.name,
      );

      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: uploadResult.url },
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await prisma.activityLog
        .create({
          data: {
            userId: session.user.id,
            action: 'AVATAR_UPDATED',
            entity: 'user',
            importance: 'INFO',
            retentionDays: 90,
            expiresAt,
          },
        })
        .catch(() => {});

      revalidatePath('/[locale]/settings', 'page');

      return NextResponse.json({
        success: true,
        image: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
      });
    }

    const data = await req.json();

    const updateData: any = {};

    if (data.image === null) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { image: true },
      });

      if (currentUser?.image && currentUser.image.includes('r2.dev')) {
        try {
          const url = new URL(currentUser.image);
          const key = url.pathname.substring(1);
          await deleteAvatar(key);
        } catch (error) {
          console.error('Failed to delete avatar:', error);
          return NextResponse.json(
            { error: 'Failed to delete avatar' },
            { status: 500 },
          );
        }
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: null },
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await prisma.activityLog
        .create({
          data: {
            userId: session.user.id,
            action: 'AVATAR_DELETED',
            entity: 'user',
            importance: 'INFO',
            retentionDays: 90,
            expiresAt,
          },
        })
        .catch(() => {});

      revalidatePath('/[locale]/settings', 'page');

      return NextResponse.json({
        success: true,
        message: 'Avatar deleted successfully',
      });
    }

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length < 2 || name.length > 50) {
        return NextResponse.json(
          { error: 'Name must be between 2 and 50 characters' },
          { status: 400 },
        );
      }
      updateData.name = name;
    }

    if (data.username !== undefined) {
      const username = data.username.trim().toLowerCase();

      if (!/^[a-z0-9_-]{3,20}$/.test(username)) {
        return NextResponse.json(
          {
            error:
              'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores',
          },
          { status: 400 },
        );
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 },
        );
      }

      updateData.username = username;
    }

    if (data.bio !== undefined) {
      updateData.bio = data.bio.trim().slice(0, 500); // Max 500 chars
    }

    if (data.location !== undefined) {
      updateData.location = data.location.trim().slice(0, 100) || null;
    }

    if (data.website !== undefined) {
      const website = data.website.trim();
      if (website && !/^https?:\/\/.+/.test(website)) {
        return NextResponse.json(
          {
            error:
              'Website must be a valid URL starting with http:// or https://',
          },
          { status: 400 },
        );
      }
      updateData.website = website || null;
    }

    if (data.twitter !== undefined) {
      updateData.twitter =
        data.twitter.trim().replace('@', '').slice(0, 50) || null;
    }

    if (data.github !== undefined) {
      updateData.github = data.github.trim().slice(0, 50) || null;
    }

    if (data.linkedin !== undefined) {
      updateData.linkedin = data.linkedin.trim().slice(0, 50) || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        location: true,
        website: true,
        twitter: true,
        github: true,
        linkedin: true,
        image: true,
      },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await prisma.activityLog
      .create({
        data: {
          userId: session.user.id,
          action: 'PROFILE_UPDATED',
          entity: 'user',
          metadata: {
            updatedFields: Object.keys(updateData),
          },
          importance: 'INFO',
          retentionDays: 90,
          expiresAt,
        },
      })
      .catch(() => {});

    revalidatePath('/', 'layout');
    revalidatePath('/[locale]/settings', 'page');

    return NextResponse.json({
      success: true,
      user: updatedUser,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
