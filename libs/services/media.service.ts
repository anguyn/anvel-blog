import { prisma } from '@/libs/prisma';
import { uploadToR2, deleteFromR2 } from '@/libs/server/r2';
import { MediaType, MediaStatus } from '@prisma/client';
import sharp from 'sharp';

// ============================================
// MEDIA SERVICE
// ============================================

export class MediaService {
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
   * Process image - resize and optimize
   */
  static async processImage(
    buffer: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {},
  ): Promise<{ processed: Buffer; width: number; height: number }> {
    const { maxWidth = 1920, maxHeight = 1080, quality = 85 } = options;

    const image = sharp(buffer);
    const metadata = await image.metadata();

    let resized = image;

    // Resize if needed
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > maxWidth || metadata.height > maxHeight)
    ) {
      resized = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Optimize
    const processed = await resized
      .jpeg({ quality, progressive: true })
      .toBuffer();

    const processedMetadata = await sharp(processed).metadata();

    return {
      processed,
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
    };
  }

  /**
   * Generate thumbnail for image
   */
  static async generateThumbnail(
    buffer: Buffer,
    width: number = 400,
    height: number = 400,
  ): Promise<Buffer> {
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  /**
   * Upload media file to R2
   */
  static async uploadMedia(
    file: Buffer,
    filename: string,
    mimeType: string,
    userId: string,
    options: {
      alt?: string;
      caption?: string;
      postId?: string;
    } = {},
  ): Promise<any> {
    const mediaType = this.getMediaType(mimeType);
    const originalName = filename;
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

    let processedBuffer = file;
    let width: number | null = null;
    let height: number | null = null;
    let thumbnailUrl: string | null = null;

    // Process images
    if (mediaType === MediaType.IMAGE) {
      const processed = await this.processImage(file);
      processedBuffer = processed.processed;
      width = processed.width;
      height = processed.height;

      // Generate and upload thumbnail
      const thumbnail = await this.generateThumbnail(file);
      const thumbnailFilename = `thumb_${safeFilename}`;
      thumbnailUrl = await uploadToR2(thumbnail, thumbnailFilename, mimeType);
    }

    // Upload main file to R2
    const url = await uploadToR2(processedBuffer, safeFilename, mimeType);

    // Save to database
    const media = await prisma.media.create({
      data: {
        filename: safeFilename,
        originalName,
        mimeType,
        size: processedBuffer.length,
        width,
        height,
        url,
        thumbnailUrl,
        storageKey: safeFilename,
        storageProvider: 's3',
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

    // Delete from R2
    await deleteFromR2(media.url);
    if (media.thumbnailUrl) {
      await deleteFromR2(media.thumbnailUrl);
    }

    // Delete from database
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        status: MediaStatus.DELETED,
      },
    });
  }

  /**
   * Get media list for user
   */
  static async getMediaList(
    userId: string,
    options: {
      type?: MediaType;
      page?: number;
      limit?: number;
    } = {},
  ) {
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
   * Update media metadata
   */
  static async updateMedia(
    mediaId: string,
    userId: string,
    data: {
      alt?: string;
      caption?: string;
    },
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
      data,
    });
  }
}
