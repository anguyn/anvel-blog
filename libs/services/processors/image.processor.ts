import sharp from 'sharp';

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ProcessImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

export class ImageProcessor {
  /**
   * Process image - resize and optimize
   */
  async processImage(
    buffer: Buffer,
    options: ProcessImageOptions = {},
  ): Promise<ProcessImageResult> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'jpeg',
    } = options;

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

    // Convert and optimize based on format
    let processed: Buffer;
    switch (format) {
      case 'webp':
        processed = await resized.webp({ quality, effort: 6 }).toBuffer();
        break;
      case 'png':
        processed = await resized
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
        break;
      case 'jpeg':
      default:
        processed = await resized
          .jpeg({ quality, progressive: true })
          .toBuffer();
        break;
    }

    const processedMetadata = await sharp(processed).metadata();

    return {
      buffer: processed,
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
      format: processedMetadata.format || format,
    };
  }

  /**
   * Generate thumbnail for image
   */
  async generateThumbnail(
    buffer: Buffer,
    width: number = 400,
    height: number = 400,
  ): Promise<Buffer> {
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer();
  }

  /**
   * Extract image metadata
   */
  async getMetadata(buffer: Buffer) {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: buffer.length,
    };
  }

  /**
   * Optimize image without resizing
   */
  async optimize(buffer: Buffer, quality: number = 85): Promise<Buffer> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    switch (metadata.format) {
      case 'jpeg':
        return await image.jpeg({ quality, progressive: true }).toBuffer();
      case 'png':
        return await image.png({ quality, compressionLevel: 9 }).toBuffer();
      case 'webp':
        return await image.webp({ quality, effort: 6 }).toBuffer();
      default:
        return buffer;
    }
  }

  /**
   * Convert image format
   */
  async convertFormat(
    buffer: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp',
    quality: number = 85,
  ): Promise<Buffer> {
    const image = sharp(buffer);

    switch (targetFormat) {
      case 'jpeg':
        return await image.jpeg({ quality, progressive: true }).toBuffer();
      case 'png':
        return await image.png({ quality, compressionLevel: 9 }).toBuffer();
      case 'webp':
        return await image.webp({ quality, effort: 6 }).toBuffer();
    }
  }
}
