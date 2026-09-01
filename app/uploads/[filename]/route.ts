import fs from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SAFE_IMAGE_FILENAME = /^[a-z0-9][a-z0-9._-]{0,254}\.(?:jpe?g|png|gif|webp)$/i;
const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

interface UploadRouteProps {
  params: Promise<{ filename: string }>;
}

export async function GET(_request: Request, { params }: UploadRouteProps) {
  const { filename } = await params;

  if (!SAFE_IMAGE_FILENAME.test(filename) || path.basename(filename) !== filename) {
    return new NextResponse(null, { status: 404 });
  }

  const extension = path.extname(filename).toLowerCase();
  const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
  const filePath = path.resolve(uploadDir, filename);

  if (path.dirname(filePath) !== uploadDir) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': CONTENT_TYPES[extension] || 'application/octet-stream',
        'Content-Length': String(file.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'EISDIR') {
      return new NextResponse(null, { status: 404 });
    }
    console.error('[Uploads] Read file error:', error);
    return NextResponse.json(
      { success: false, message: '读取图片失败' },
      { status: 500 }
    );
  }
}
