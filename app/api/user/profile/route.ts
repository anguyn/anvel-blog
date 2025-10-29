import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/server/auth';
import { prisma } from '@/libs/prisma';
import { uploadAvatar, deleteFromR2 } from '@/libs/server/r2';
import { getProxiedImageUrl, extractR2Key } from '@/libs/utils';

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

      // Delete old avatar if exists
      if (currentUser?.image) {
        try {
          const oldKey = extractR2Key(currentUser.image);
          await deleteFromR2(oldKey);
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

      // Get proxied URL
      const proxiedUrl = getProxiedImageUrl(uploadResult.url);

      // Update user
      console.log('Ra gì mẹ: ', proxiedUrl);
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { image: uploadResult.url }, // Store R2 URL in DB
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
        image: proxiedUrl, // Return proxied URL to client
        imageR2: uploadResult.url, // Original R2 URL (for reference)
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
      updateData.location = data.location.trim().slice(0, 100);
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

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
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
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        twitter: updatedUser.twitter,
        github: updatedUser.github,
        linkedin: updatedUser.linkedin,
        image: updatedUser.image ? getProxiedImageUrl(updatedUser.image) : null,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
