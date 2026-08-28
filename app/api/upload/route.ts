import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

import { requireAuth, isAuthError, requireAgentAuth } from '@/lib/auth-middleware-app';
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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

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
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, validation.buffer);

    return NextResponse.json({
      success: true,
      message: '上传成功',
      data: {
        url: `/uploads/${filename}`,
        filename: validation.originalName,
        size: validation.size,
        mimetype: validation.mimeType,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
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
