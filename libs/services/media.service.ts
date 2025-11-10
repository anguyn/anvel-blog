import { prisma } from '@/libs/prisma';
import { uploadToR2, deleteFromR2 } from '@/libs/server/r2';
import { MediaType, MediaStatus } from '@prisma/client';
import { ImageProcessor } from './processors/image.processor';

export interface UploadMediaOptions {
  alt?: string;
  caption?: string;
  postId?: string;
  folder?: string;
}

export interface GetMediaListOptions {
  type?: MediaType;
  page?: number;
  limit?: number;
}

export class MediaService {
  private static imageProcessor = new ImageProcessor();

  /**
   * Determine media type from MIME type
   */
  static getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    if (mimeType.startsWith('audio/')) return MediaType.AUDIO;
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      mimeType.includes('excel') ||
      mimeType.includes('powerpoint')
    ) {
      return MediaType.DOCUMENT;
    }
    if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return MediaType.ARCHIVE;
    }
    return MediaType.OTHER;
  }

  /**
   * Upload media file to R2
   */
  static async uploadMedia(
    file: Buffer,
    filename: string,
    mimeType: string,
    userId: string,
    options: UploadMediaOptions = {},
  ) {
    const mediaType = this.getMediaType(mimeType);
    const folder = options.folder || this.getDefaultFolder(mediaType);

    let width: number | null = null;
    let height: number | null = null;

    const uploadResult = await uploadToR2(file, filename, mimeType, {
      folder,
      maxWidth: mediaType === MediaType.IMAGE ? 1920 : undefined,
      maxHeight: mediaType === MediaType.IMAGE ? 1080 : undefined,
      quality: 85,
      convertToWebP: mediaType === MediaType.IMAGE,
      generateThumbnail: mediaType === MediaType.IMAGE,
    });

    if (mediaType === MediaType.IMAGE) {
      width = uploadResult.width || null;
      height = uploadResult.height || null;
    }

    const media = await prisma.media.create({
      data: {
        filename: uploadResult.key.split('/').pop() || filename,
        originalName: filename,
        mimeType,
        size: uploadResult.size,
        width,
        height,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        storageKey: uploadResult.key,
        storageProvider: 'r2',
        bucket: process.env.R2_BUCKET_NAME,
        type: mediaType,
        alt: options.alt,
        caption: options.caption,
        uploadedById: userId,
        status: MediaStatus.READY,
        processedAt: new Date(),
      },
    });

    return media;
  }

  /**
   * Delete media
   */
  static async deleteMedia(mediaId: string, userId: string): Promise<void> {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('MEDIA_NOT_FOUND');
    }

    if (media.uploadedById !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    await deleteFromR2(media.url);
    if (media.thumbnailUrl) {
      await deleteFromR2(media.thumbnailUrl);
    }

    await prisma.media.delete({
      where: { id: mediaId },
    });
  }

  /**
   * Get media list for user
   */
  static async getMediaList(userId: string, options: GetMediaListOptions = {}) {
    const { type, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      uploadedById: userId,
      status: MediaStatus.READY,
    };

    if (type) {
      where.type = type;
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      }),
      prisma.media.count({ where }),
    ]);

    return {
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get media by ID
   */
  static async getMediaById(mediaId: string, userId?: string) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    if (!media) {
      throw new Error('MEDIA_NOT_FOUND');
    }

    if (
      userId &&
      media.uploadedById !== userId &&
      media.status !== MediaStatus.READY
    ) {
      throw new Error('UNAUTHORIZED');
    }

    return media;
  }

  /**
   * Update media metadata
   */
  static async updateMedia(
    mediaId: string,
    userId: string,
    data: { alt?: string; caption?: string },
  ) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('MEDIA_NOT_FOUND');
    }

    if (media.uploadedById !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    return await prisma.media.update({
      where: { id: mediaId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Bulk delete media
   */
  static async bulkDeleteMedia(
    mediaIds: string[],
    userId: string,
  ): Promise<void> {
    const mediaList = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        uploadedById: userId,
      },
    });

    if (mediaList.length !== mediaIds.length) {
      throw new Error('SOME_MEDIA_NOT_FOUND_OR_UNAUTHORIZED');
    }

    const deletePromises = mediaList.flatMap(media => {
      const promises = [deleteFromR2(media.url)];
      if (media.thumbnailUrl) {
        promises.push(deleteFromR2(media.thumbnailUrl));
      }
      return promises;
    });

    await Promise.all(deletePromises);

    await prisma.media.deleteMany({
      where: {
        id: { in: mediaIds },
      },
    });
  }

  /**
   * Get media statistics for user
   */
  static async getMediaStats(userId: string) {
    const stats = await prisma.media.groupBy({
      by: ['type'],
      where: {
        uploadedById: userId,
        status: MediaStatus.READY,
      },
      _count: {
        id: true,
      },
      _sum: {
        size: true,
      },
    });

    const totalSize = await prisma.media.aggregate({
      where: {
        uploadedById: userId,
        status: MediaStatus.READY,
      },
      _sum: {
        size: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      byType: stats.map(stat => ({
        type: stat.type,
        count: stat._count.id,
        totalSize: stat._sum.size || 0,
      })),
      total: {
        count: totalSize._count.id,
        size: totalSize._sum.size || 0,
      },
    };
  }

  /**
   * Get default folder based on media type
   */
  private static getDefaultFolder(mediaType: MediaType): string {
    const folderMap: Record<MediaType, string> = {
      [MediaType.IMAGE]: 'images',
      [MediaType.VIDEO]: 'videos',
      [MediaType.AUDIO]: 'audio',
      [MediaType.DOCUMENT]: 'documents',
      [MediaType.ARCHIVE]: 'archives',
      [MediaType.OTHER]: 'files',
    };

    return folderMap[mediaType] || 'uploads';
  }
}
