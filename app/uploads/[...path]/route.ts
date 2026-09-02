import { NextResponse } from 'next/server';

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  MEDIA_IMAGE_EXTENSIONS,
  MediaLibraryError,
  resolveMediaFile,
} from '@/lib/media-library';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
};

interface UploadRouteProps {
  params: Promise<{ path: string[] }>;
}

export async function GET(_request: Request, { params }: UploadRouteProps) {
  const { path: segments } = await params;
  if (!Array.isArray(segments) || segments.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const target = resolveMediaFile(['uploads', ...segments].join('/'));
    const extension = path.extname(target.absolutePath).toLowerCase();
    if (!MEDIA_IMAGE_EXTENSIONS.includes(extension)) {
      return new NextResponse(null, { status: 404 });
    }
    const file = await fs.readFile(target.absolutePath);

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': CONTENT_TYPES[extension] || 'application/octet-stream',
        'Content-Length': String(file.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof MediaLibraryError) {
      return new NextResponse(null, { status: 404 });
    }
    console.error('[Uploads] Read file error:', error);
    return NextResponse.json(
      { success: false, message: '读取图片失败' },
      { status: 500 },
    );
  }
}
