import { NextResponse } from 'next/server';

import path from 'node:path';

import {
  MEDIA_IMAGE_EXTENSIONS,
  MediaLibraryError,
  mediaPathToUrl,
  normalizeMediaPath,
} from '@/lib/media-library';
import { getMediaStore, isCosConfigured } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface UploadRouteProps {
  params: Promise<{ path: string[] }>;
}

// Only these reviewed project files may contain executable content. User uploads
// remain image-only; do not allow arbitrary HTML or JavaScript under /uploads.
const PROJECT_FILES = new Set([
  'uploads/ai-interior-design/product/index.html',
  'uploads/ai-interior-design/product/product.css',
  'uploads/ai-interior-design/product/product.js',
  'uploads/ai-interior-design/demo/index.html',
  'uploads/ai-interior-design/demo/app.js',
  'uploads/ai-interior-design/demo/model-data.js',
]);

export async function GET(_request: Request, { params }: UploadRouteProps) {
  const { path: segments } = await params;
  if (!Array.isArray(segments) || segments.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const relativePath = normalizeMediaPath(['uploads', ...segments].join('/'));
    const extension = path.posix.extname(relativePath).toLowerCase();
    const isProjectFile = PROJECT_FILES.has(relativePath);
    if (!relativePath.startsWith('uploads/') || (!MEDIA_IMAGE_EXTENSIONS.includes(extension) && !isProjectFile)) {
      return new NextResponse(null, { status: 404 });
    }
    if (!isCosConfigured()) {
      return NextResponse.json(
        { success: false, message: '未配置腾讯云 COS' },
        { status: 503 },
      );
    }
    // Keep both iframe documents on the site origin so the model's postMessage
    // navigation still works. Large scripts and images can load directly from COS.
    if (isProjectFile && extension === '.html') {
      const file = await getMediaStore().getObject(relativePath);
      if (!file) return new NextResponse(null, { status: 404 });
      return new NextResponse(new Uint8Array(file.body), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
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
