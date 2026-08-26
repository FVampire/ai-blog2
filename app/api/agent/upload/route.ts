import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

import { requireAgentAuth } from '@/lib/auth-middleware-app';

/**
 * Agent API: Image upload for blog posts
 *
 * POST /api/agent/upload
 * Headers: Authorization: Bearer <AGENT_API_KEY>
 * Body: multipart/form-data with "file" field
 */
export async function POST(request: NextRequest) {
  const authResult = requireAgentAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: '仅支持图片格式 (jpeg, png, gif, webp, svg)' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));

    const fileUrl = `/uploads/${filename}`;
    const siteUrl = process.env.SITE_URL || '';

    return NextResponse.json({
      success: true,
      message: '上传成功',
      data: {
        url: fileUrl,
        fullUrl: siteUrl ? `${siteUrl}${fileUrl}` : fileUrl,
        filename: file.name,
        size: file.size,
        mimetype: file.type,
      },
    });
  } catch (error) {
    console.error('[Agent] Upload error:', error);
    return NextResponse.json(
      { success: false, message: '上传失败' },
      { status: 500 }
    );
  }
}
