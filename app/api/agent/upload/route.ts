import { NextRequest, NextResponse } from 'next/server';

import { requireAgentAuth } from '@/lib/auth-middleware-app';
import { recordAuditEvent } from '@/lib/audit-log';
import { MediaLibraryError, putMediaFile } from '@/lib/media-library';
import { validateImageFile } from '@/lib/upload-image';

const DEFAULT_AUTHOR_ID = parseInt(process.env.AGENT_AUTHOR_ID || '1', 10);

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
    const stored = await putMediaFile('uploads', filename, validation.buffer, validation.mimeType);

    await recordAuditEvent({
      request,
      user: { userId: DEFAULT_AUTHOR_ID, username: 'Agent', email: '', role: 'agent' },
      action: 'agent.media.upload',
      resourceType: 'media',
      resourceId: stored.relativePath,
      metadata: {
        originalName: validation.originalName,
        size: validation.size,
        mimeType: validation.mimeType,
        url: stored.url,
      },
    });

    return NextResponse.json({
      success: true,
      message: '上传成功',
      data: {
        url: stored.url,
        fullUrl: stored.url,
        path: stored.relativePath,
        filename: validation.originalName,
        size: validation.size,
        mimetype: validation.mimeType,
      },
    });
  } catch (error) {
    console.error('[Agent] Upload error:', error);
    if (error instanceof MediaLibraryError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { success: false, message: '上传失败' },
      { status: 500 }
    );
  }
}
