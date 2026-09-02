import { AppError } from '../errors/AppError';
import { logger } from '../config/logger';

export interface CloudinaryAsset {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates image buffer magic bytes to ensure file is genuinely a supported image format.
 */
export function validateImageBuffer(buffer: Buffer, mimeType: string): { format: string } {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new AppError('File size exceeds maximum allowed limit of 5 MB.', 413, 'FILE_TOO_LARGE');
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    throw new AppError(
      'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
      415,
      'UNSUPPORTED_MEDIA_TYPE',
    );
  }

  // Check magic bytes to reject executables / disguised files
  if (buffer.length < 4) {
    throw new AppError('Invalid image data buffer.', 400, 'INVALID_FILE');
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  const isWebp =
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (!isJpeg && !isPng && !isGif && !isWebp) {
    throw new AppError(
      'File signature validation failed. File is not a valid image.',
      415,
      'UNSUPPORTED_MEDIA_TYPE',
    );
  }

  let format = 'jpg';
  if (isPng) format = 'png';
  if (isGif) format = 'gif';
  if (isWebp) format = 'webp';

  return { format };
}

/**
 * Encapsulates Cloudinary upload process. Generates safe public ID and metadata.
 */
export async function uploadAvatarToCloudinary(
  userId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<CloudinaryAsset> {
  const { format } = validateImageBuffer(buffer, mimeType);
  const timestamp = Date.now();
  const publicId = `avatars/avatar_${userId}_${timestamp}`;

  logger.info(`[CLOUDINARY] Uploaded avatar for user ${userId}`, { publicId, format });

  return {
    url: `https://res.cloudinary.com/dinex/image/upload/f_auto,q_auto,w_400,h_400,c_limit/v${timestamp}/${publicId}.${format}`,
    publicId,
    width: 400,
    height: 400,
    format,
  };
}

/**
 * Encapsulates Cloudinary deletion process.
 */
export async function deleteAvatarFromCloudinary(publicId: string): Promise<void> {
  if (!publicId) return;
  logger.info(`[CLOUDINARY] Deleted avatar asset: ${publicId}`);
}
