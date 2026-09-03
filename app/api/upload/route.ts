import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError, requireAgentAuth } from '@/lib/auth-middleware-app';
import { MediaLibraryError, putMediaFile } from '@/lib/media-library';
import { validateImageFile } from '@/lib/upload-image';

function isAuthorized(request: NextRequest): boolean {
  const jwtResult = requireAuth(request);
  if (!isAuthError(jwtResult)) return true;
  const agentResult = requireAgentAuth(request);
  return agentResult === true;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: '需要认证' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') || 'uploads';

    if (!file) {
      return NextResponse.json(
        { success: false, message: '没有找到上传的文件' },
        { status: 400 }
      );
    }

    const validation = await validateImageFile(file);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}${validation.extension}`;
    const stored = await putMediaFile(folder, filename, validation.buffer, validation.mimeType);

    return NextResponse.json({
      success: true,
      message: '上传成功',
      data: {
        url: stored.url,
        path: stored.relativePath,
        filename: validation.originalName,
        size: validation.size,
        mimetype: validation.mimeType,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof MediaLibraryError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: '上传失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
