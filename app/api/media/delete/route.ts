import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';

import { recordAuditEvent } from '@/lib/audit-log';
import { requireRoles, isAuthError } from '@/lib/auth-middleware-app';
import { MediaLibraryError, resolveMediaFile } from '@/lib/media-library';
import { countPostMediaReferences } from '@/lib/media-post-references';

export async function DELETE(request: NextRequest) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;

  try {
    const { path: mediaPath, filename } = await request.json();

    if (!mediaPath && !filename) {
      return NextResponse.json(
        { success: false, message: '缺少文件名参数' },
        { status: 400 }
      );
    }

    const target = resolveMediaFile(mediaPath || `uploads/${filename}`);
    const references = await countPostMediaReferences(target.url);
    if (references > 0) {
      return NextResponse.json(
        { success: false, message: `有 ${references} 篇文章正在使用这张图片，不能删除`, code: 'FILE_IN_USE' },
        { status: 409 },
      );
    }

    fs.unlinkSync(target.absolutePath);
    await recordAuditEvent({
      request,
      user: authResult.user,
      action: 'media.delete',
      resourceType: 'media',
      resourceId: target.relativePath,
      metadata: { path: target.relativePath, url: target.url },
    });

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    if (error instanceof MediaLibraryError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: '删除失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
