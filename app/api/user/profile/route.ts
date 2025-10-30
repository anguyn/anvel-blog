import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/server/auth';
import { prisma } from '@/libs/prisma';
import { uploadAvatar, deleteFromR2 } from '@/libs/server/r2';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // Handle multipart form data (with file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('avatar') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 },
        );
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File must be an image' },
          { status: 400 },
        );
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 5MB' },
          { status: 400 },
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Get current user
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { image: true },
      });

      // Delete old avatar if exists (and not default)
      if (currentUser?.image && currentUser.image.includes('r2.dev')) {
        try {
          // Extract key from R2 URL
          const url = new URL(currentUser.image);
          const key = url.pathname.substring(1); // Remove leading slash
          await deleteFromR2(key);
        } catch (error) {
          console.error('Failed to delete old avatar:', error);
          // Don't fail the request if deletion fails
        }
      }

      // Upload new avatar
      const uploadResult = await uploadAvatar(
        buffer,
        session.user.id,
        file.name,
      );

      // Update user with direct R2 URL
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: uploadResult.url }, // Store R2 public URL directly
      });

      // Log activity
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

      return NextResponse.json({
        success: true,
        image: uploadResult.url, // Return R2 URL directly
        thumbnailUrl: uploadResult.thumbnailUrl,
      });
    }

    // Handle JSON data (profile info update)
    const data = await req.json();

    // Validate and sanitize data
    const updateData: any = {};

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

      // Validate username format
      if (!/^[a-z0-9_-]{3,20}$/.test(username)) {
        return NextResponse.json(
          {
            error:
              'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores',
          },
          { status: 400 },
        );
      }

      // Check if username is already taken
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

    // Check if there's any data to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    // Update user profile
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

    // Log activity
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

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
