import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'crypto';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export interface UploadOptions {
  folder?: string; // e.g., 'avatars', 'posts', 'media'
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  convertToWebP?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
}

export interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  size: number;
  width?: number;
  height?: number;
  format: string;
}

/**
 * Upload file to R2 with image optimization
 * Returns direct R2 public URL
 */
export async function uploadToR2(
  file: Buffer,
  originalFileName: string,
  contentType: string,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const {
    folder = 'uploads',
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 85,
    convertToWebP = true,
    generateThumbnail = false,
    thumbnailSize = { width: 150, height: 150 },
  } = options;

  const isImage = contentType.startsWith('image/');
  let processedBuffer = file;
  let finalContentType = contentType;
  let fileExtension = originalFileName.split('.').pop() || 'bin';
  let metadata: { width?: number; height?: number } = {};

  if (isImage) {
    try {
      let image = sharp(file);
      const imageMetadata = await image.metadata();

      metadata.width = imageMetadata.width;
      metadata.height = imageMetadata.height;

      if (
        (imageMetadata.width && imageMetadata.width > maxWidth) ||
        (imageMetadata.height && imageMetadata.height > maxHeight)
      ) {
        image = image.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (convertToWebP && imageMetadata.format !== 'gif') {
        processedBuffer = await image.webp({ quality, effort: 6 }).toBuffer();

        finalContentType = 'image/webp';
        fileExtension = 'webp';

        const processedMetadata = await sharp(processedBuffer).metadata();
        metadata.width = processedMetadata.width;
        metadata.height = processedMetadata.height;
      } else {
        processedBuffer = await image.toBuffer();
      }
    } catch (error) {
      console.error('Image processing error:', error);
    }
  }

  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  const sanitizedName = originalFileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase()
    .slice(0, 50);

  const fileName = `${sanitizedName}-${timestamp}-${randomStr}.${fileExtension}`;
  const key = `${folder}/${fileName}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: processedBuffer,
      ContentType: finalContentType,
      CacheControl: 'public, max-age=31536000',
      Metadata: {
        originalName: originalFileName,
        uploadedAt: new Date().toISOString(),
      },
    }),
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  const result: UploadResult = {
    url: publicUrl,
    key,
    size: processedBuffer.length,
    format: fileExtension,
    ...metadata,
  };

  if (generateThumbnail && isImage) {
    try {
      const thumbnailBuffer = await sharp(file)
        .resize(thumbnailSize.width, thumbnailSize.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailKey = `${folder}/thumbnails/${fileName.replace(`.${fileExtension}`, '-thumb.webp')}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000',
        }),
      );

      result.thumbnailUrl = `${process.env.R2_PUBLIC_URL}/${thumbnailKey}`;
      result.thumbnailKey = thumbnailKey;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
    }
  }

  return result;
}

/**
 * Upload avatar with specific optimizations
 * Returns direct R2 public URL for immediate use
 */
export async function uploadAvatar(
  file: Buffer,
  userId: string,
  originalFileName: string,
): Promise<UploadResult> {
  return uploadToR2(
    file,
    `avatar-${userId}-${originalFileName}`,
    'image/jpeg',
    {
      folder: 'avatars',
      maxWidth: 500,
      maxHeight: 500,
      quality: 90,
      convertToWebP: true,
      generateThumbnail: true,
      thumbnailSize: { width: 150, height: 150 },
    },
  );
}

/**
 * Delete file from R2
 * @param keyOrUrl - R2 key or full URL
 */
export async function deleteFromR2(keyOrUrl: string): Promise<void> {
  let key = keyOrUrl;

  if (keyOrUrl.startsWith('http')) {
    try {
      const url = new URL(keyOrUrl);
      key = url.pathname.substring(1);
    } catch (error) {
      console.error('Invalid URL:', keyOrUrl);
      throw new Error('Invalid R2 URL');
    }
  }

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
    );
    console.log('Deleted from R2:', key);
  } catch (error) {
    console.error('Delete from R2 error:', error);
    throw error;
  }
}

/**
 * Delete file and its thumbnail
 */
export async function deleteFileWithThumbnail(
  result: UploadResult,
): Promise<void> {
  const promises: Promise<void>[] = [deleteFromR2(result.key)];

  if (result.thumbnailKey) {
    promises.push(deleteFromR2(result.thumbnailKey));
  }

  await Promise.allSettled(promises);
}

/**
 * Delete avatar and its thumbnail (based on avatar URL or key)
 */
export async function deleteAvatar(avatarKeyOrUrl: string): Promise<void> {
  if (!avatarKeyOrUrl) return;

  let key = avatarKeyOrUrl;
  if (avatarKeyOrUrl.startsWith('http')) {
    try {
      const url = new URL(avatarKeyOrUrl);
      key = url.pathname.substring(1);
    } catch {
      console.error('Invalid avatar URL:', avatarKeyOrUrl);
      return;
    }
  }

  const parts = key.split('/');
  const fileName = parts.pop()!;
  const folder = parts.join('/');

  const thumbnailFileName = fileName
    .replace(/\.[^.]+$/, '-thumb.webp')
    .replace('-thumb-thumb', '-thumb');

  const thumbnailKey = `${folder}/thumbnails/${thumbnailFileName}`;

  await Promise.allSettled([deleteFromR2(key), deleteFromR2(thumbnailKey)]);

  console.log(`Deleted avatar and thumbnail:`, { key, thumbnailKey });
}

/**
 * Check if file exists in R2
 */
export async function fileExists(keyOrUrl: string): Promise<boolean> {
  let key = keyOrUrl;

  if (keyOrUrl.startsWith('http')) {
    try {
      const url = new URL(keyOrUrl);
      key = url.pathname.substring(1);
    } catch {
      return false;
    }
  }

  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get file metadata from R2
 */
export async function getFileMetadata(keyOrUrl: string) {
  let key = keyOrUrl;

  if (keyOrUrl.startsWith('http')) {
    try {
      const url = new URL(keyOrUrl);
      key = url.pathname.substring(1);
    } catch {
      return null;
    }
  }

  try {
    const response = await r2Client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
    );

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('Get metadata error:', error);
    return null;
  }
}

export { r2Client };
