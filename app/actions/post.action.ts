'use server';

import { revalidatePath } from 'next/cache';
import { PostService } from '@/libs/services/post.service';
import {
  requireAuth,
  requirePermission,
  Permissions,
} from '@/libs/server/rbac';
import {
  PostFormData,
  CreatePostResponse,
  UpdatePostResponse,
  DeletePostResponse,
} from '@/types/post.types';
import { PostStatus } from '@prisma/client';
import { getActionTranslations } from '@/i18n/i18n';

// ============================================
// HELPER: Map form data to service data
// ============================================
function mapFormDataToServiceData(formData: Partial<PostFormData>) {
  const serviceData: any = { ...formData };

  // Map tagIds -> tags (just rename the field)
  if (formData.tagIds !== undefined) {
    serviceData.tagIds = formData.tagIds;
    delete serviceData.tags; // Remove if exists
  }

  // Convert date strings to Date objects
  if (formData.publishedAt) {
    serviceData.publishedAt = new Date(formData.publishedAt);
  }
  if (formData.scheduledFor) {
    serviceData.scheduledFor = new Date(formData.scheduledFor);
  }

  // Clean up empty strings for optional fields
  if (serviceData.categoryId === '' || serviceData.categoryId === '0') {
    serviceData.categoryId = undefined;
  }

  return serviceData;
}

// ============================================
// POST ACTIONS
// ============================================

/**
 * Create post
 */
export async function createPostAction(
  data: PostFormData,
): Promise<CreatePostResponse> {
  try {
    const { t, locale } = await getActionTranslations();

    const session = await requireAuth();
    await requirePermission(Permissions.POSTS_CREATE);

    const serviceData = mapFormDataToServiceData(data);

    const post = await PostService.createPost(serviceData, session.user.id!);

    await queuePostTranslations(post.id, data.language || 'vi', locale);

    revalidatePath('/admin/posts');
    revalidatePath('/blog');
    if (post.category?.slug) {
      revalidatePath(`/blog/category/${post.category.slug}`);
    }

    return {
      success: true,
      post,
    };
  } catch (error) {
    console.error('Create post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Queue translation jobs for a post
 * @param postId - The post ID to translate
 * @param sourceLanguage - The original language of the post
 */
async function queuePostTranslations(
  postId: string,
  sourceLanguage: 'en' | 'vi' | string,
  locale: 'en' | 'vi',
): Promise<void> {
  const targetLanguages: Array<'en' | 'vi'> =
    sourceLanguage === 'en' ? ['vi'] : ['en'];

  const translationPromises = targetLanguages.map(async targetLanguage => {
    try {
      const queueDomain =
        process.env.NOTIFICATION_SERVICE_URL || 'https://noti.anvel.site';

      const response = await fetch(
        `${queueDomain}/api/media/translate/post?lang=${locale}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId,
            targetLanguage,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        console.error(
          `Failed to queue translation to ${targetLanguage}:`,
          error,
        );
      } else {
        const result = await response.json();
        console.log(`Translation to ${targetLanguage} queued:`, result.jobId);
      }
    } catch (error) {
      console.error(`Error queuing translation to ${targetLanguage}:`, error);
    }
  });

  await Promise.allSettled(translationPromises);
}

/**
 * Update post
 */
export async function updatePostAction(
  postId: string,
  data: Partial<PostFormData>,
): Promise<UpdatePostResponse> {
  try {
    const session = await requireAuth();
    await requirePermission(Permissions.POSTS_UPDATE);

    // Map form data to service format
    const serviceData = mapFormDataToServiceData(data);

    const post = await PostService.updatePost(
      postId,
      serviceData,
      session.user.id!,
    );

    revalidatePath('/admin/posts');
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath('/blog');
    if (post.category?.slug) {
      revalidatePath(`/blog/category/${post.category.slug}`);
    }

    return {
      success: true,
      post,
    };
  } catch (error) {
    console.error('Update post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Delete post
 */
export async function deletePostAction(
  postId: string,
): Promise<DeletePostResponse> {
  try {
    const session = await requireAuth();
    await requirePermission(Permissions.POSTS_DELETE);

    await PostService.deletePost(postId, session.user.id!);

    revalidatePath('/admin/posts');
    revalidatePath('/blog');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Publish post
 */
export async function publishPostAction(
  postId: string,
): Promise<UpdatePostResponse> {
  return updatePostAction(postId, {
    status: PostStatus.PUBLISHED,
    publishedAt: new Date(),
  });
}

/**
 * Unpublish post
 */
export async function unpublishPostAction(
  postId: string,
): Promise<UpdatePostResponse> {
  return updatePostAction(postId, {
    status: PostStatus.DRAFT,
  });
}

/**
 * Schedule post
 */
export async function schedulePostAction(
  postId: string,
  scheduledFor: Date,
): Promise<UpdatePostResponse> {
  return updatePostAction(postId, {
    status: PostStatus.SCHEDULED,
    scheduledFor: scheduledFor,
  });
}

/**
 * Record view
 */
export async function recordPostViewAction(
  postId: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  },
): Promise<{ success: boolean }> {
  try {
    const session = await requireAuth().catch(() => null);
    const userId = session?.user?.id;

    await PostService.recordView(
      postId,
      userId,
      metadata?.ipAddress,
      metadata?.userAgent,
      metadata?.referrer,
    );

    return { success: true };
  } catch (error) {
    console.error('Record view error:', error);
    return { success: false };
  }
}

/**
 * Toggle favorite
 */
export async function toggleFavoriteAction(
  postId: string,
): Promise<{ success: boolean; isFavorited: boolean }> {
  try {
    const session = await requireAuth();

    const isFavorited = await PostService.toggleFavorite(
      postId,
      session.user.id,
    );

    revalidatePath(`/blog/${postId}`);
    revalidatePath('/profile/favorites');

    return {
      success: true,
      isFavorited,
    };
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return {
      success: false,
      isFavorited: false,
    };
  }
}

/**
 * Verify password
 */
export async function verifyPostPasswordAction(
  postId: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const isValid = await PostService.verifyPostPassword(postId, password);

    if (!isValid) {
      return {
        success: false,
        error: 'INVALID_PASSWORD',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Get post stats
 */
export async function getPostStatsAction() {
  try {
    const session = await requireAuth();
    const stats = await PostService.getPostStats(session.user.id);
    return { success: true, stats };
  } catch (error) {
    console.error('Get stats error:', error);
    return { success: false, error: 'FAILED_TO_GET_STATS' };
  }
}
