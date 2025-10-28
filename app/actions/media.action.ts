'use server';

import { revalidatePath } from 'next/cache';
import { MediaService } from '@/libs/services/media.service';
import {
  requireAuth,
  requirePermission,
  Permissions,
} from '@/libs/server/rbac';

// ============================================
// MEDIA ACTIONS
// ============================================

/**
 * Upload media file
 */
export async function uploadMediaAction(formData: FormData) {
  try {
    const session = await requireAuth();
    await requirePermission(Permissions.MEDIA_UPLOAD);

    const file = formData.get('file') as File;
    const alt = formData.get('alt') as string | null;
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return {
        success: false,
        error: 'NO_FILE_PROVIDED',
      };
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const media = await MediaService.uploadMedia(
      buffer,
      file.name,
      file.type,
      session.user.id!,
      {
        alt: alt || undefined,
        caption: caption || undefined,
      },
    );

    revalidatePath('/admin/media');

    return {
      success: true,
      media,
    };
  } catch (error) {
    console.error('Upload media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'UPLOAD_FAILED',
    };
  }
}

/**
 * Delete media
 */
export async function deleteMediaAction(mediaId: string) {
  try {
    const session = await requireAuth();
    await requirePermission(Permissions.MEDIA_DELETE);

    await MediaService.deleteMedia(mediaId, session.user.id!);

    revalidatePath('/admin/media');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'DELETE_FAILED',
    };
  }
}

/**
 * Update media metadata
 */
export async function updateMediaAction(
  mediaId: string,
  data: { alt?: string; caption?: string },
) {
  try {
    const session = await requireAuth();

    const media = await MediaService.updateMedia(
      mediaId,
      session.user.id!,
      data,
    );

    revalidatePath('/admin/media');

    return {
      success: true,
      media,
    };
  } catch (error) {
    console.error('Update media error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'UPDATE_FAILED',
    };
  }
}

/**
 * Get media list
 */
export async function getMediaListAction(options?: {
  type?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const session = await requireAuth();

    const result = await MediaService.getMediaList(
      session.user.id!,
      options as any,
    );

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('Get media list error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'FETCH_FAILED',
    };
  }
}
