import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { listMediaFolder, MediaLibraryError } from '@/lib/media-library';

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

    const folder = searchParams.get('folder') || '';
    const listing = listMediaFolder(folder);
    const images = listing.images;

    const total = images.length;
    const offset = (page - 1) * limit;

    return NextResponse.json({
      success: true,
      data: {
        images: images.slice(offset, offset + limit),
        folders: listing.folders,
        currentFolder: listing.currentFolder,
        breadcrumbs: listing.breadcrumbs,
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
    if (error instanceof MediaLibraryError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.status },
      );
    }
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
