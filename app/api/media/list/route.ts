import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    const parsedLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    const limit = Number.isNaN(parsedLimit) || parsedLimit < 1
      ? DEFAULT_LIMIT
      : Math.min(parsedLimit, MAX_LIMIT);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return NextResponse.json({
        success: true,
        data: {
          images: [],
          total: 0,
          pagination: { page, limit, total: 0, totalPages: 0 },
        },
      });
    }

    const files = fs.readdirSync(uploadsDir);

    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: `/uploads/${file}`,
          size: stats.size,
          uploadedAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    const total = images.length;
    const offset = (page - 1) * limit;

    return NextResponse.json({
      success: true,
      data: {
        images: images.slice(offset, offset + limit),
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get images error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取图片列表失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
