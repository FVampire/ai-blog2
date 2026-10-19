import { NextResponse } from 'next/server';

import path from 'node:path';

import {
  MEDIA_IMAGE_EXTENSIONS,
  MediaLibraryError,
  mediaPathToUrl,
  normalizeMediaPath,
} from '@/lib/media-library';
import { isCosConfigured } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface UploadRouteProps {
  params: Promise<{ path: string[] }>;
}

// /uploads only serves images; HTML or JavaScript must never be served from here.
export async function GET(_request: Request, { params }: UploadRouteProps) {
  const { path: segments } = await params;
  if (!Array.isArray(segments) || segments.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const relativePath = normalizeMediaPath(['uploads', ...segments].join('/'));
    const extension = path.posix.extname(relativePath).toLowerCase();
    if (!relativePath.startsWith('uploads/') || !MEDIA_IMAGE_EXTENSIONS.includes(extension)) {
      return new NextResponse(null, { status: 404 });
    }
    if (!isCosConfigured()) {
      return NextResponse.json(
        { success: false, message: '未配置腾讯云 COS' },
        { status: 503 },
      );
    }
    return NextResponse.redirect(mediaPathToUrl(relativePath), 302);
  } catch (error) {
    if (error instanceof MediaLibraryError) {
      return new NextResponse(null, { status: 404 });
    }
    console.error('[Uploads] Read file error:', error);
    return NextResponse.json(
      { success: false, message: '读取资源失败' },
      { status: 500 },
    );
  }
}
