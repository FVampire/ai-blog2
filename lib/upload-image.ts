import path from 'path';

export type ImageFormat = 'jpeg' | 'png' | 'gif' | 'webp';

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

const FORMAT_BY_EXTENSION: Record<string, ImageFormat> = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.gif': 'gif',
  '.webp': 'webp',
};

const FORMAT_BY_MIME_TYPE: Record<string, ImageFormat> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export const EXTENSION_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: '.jpg',
  png: '.png',
  gif: '.gif',
  webp: '.webp',
};

export function detectImageFormat(buffer: Buffer): ImageFormat | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return 'png';
  }

  const head6 = buffer.toString('ascii', 0, 6);
  if (head6 === 'GIF87a' || head6 === 'GIF89a') {
    return 'gif';
  }

  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }

  return null;
}

export type ImageValidationError = {
  ok: false;
  message: string;
};

export type ImageValidationSuccess = {
  ok: true;
  format: ImageFormat;
  extension: string;
  buffer: Buffer;
  originalName: string;
  size: number;
  mimeType: string;
};

export async function validateImageFile(file: File): Promise<ImageValidationError | ImageValidationSuccess> {
  const declaredExt = path.extname(file.name).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(declaredExt)) {
    return {
      ok: false,
      message: `不支持的文件扩展名，仅允许 ${ALLOWED_IMAGE_EXTENSIONS.join('、')}`,
    };
  }

  const declaredMimeType = (file.type || '').toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(declaredMimeType)) {
    return { ok: false, message: '不支持的文件类型，仅允许上传图片' };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return { ok: false, message: '文件大小超过限制，最大 10MB' };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (buffer.length > MAX_IMAGE_FILE_SIZE) {
    return { ok: false, message: '文件大小超过限制，最大 10MB' };
  }

  const detectedFormat = detectImageFormat(buffer);
  if (!detectedFormat) {
    return { ok: false, message: '文件内容不是有效的图片（仅支持 JPEG/PNG/GIF/WebP）' };
  }

  if (
    detectedFormat !== FORMAT_BY_EXTENSION[declaredExt] ||
    detectedFormat !== FORMAT_BY_MIME_TYPE[declaredMimeType]
  ) {
    return { ok: false, message: '文件实际内容与扩展名或类型不符' };
  }

  return {
    ok: true,
    format: detectedFormat,
    extension: EXTENSION_BY_FORMAT[detectedFormat],
    buffer,
    originalName: file.name,
    size: file.size,
    mimeType: file.type,
  };
}
