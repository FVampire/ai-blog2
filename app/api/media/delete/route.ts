import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

import { requireRoles, isAuthError } from '@/lib/auth-middleware-app';
import { recordAuditEvent } from '@/lib/audit-log';

export async function DELETE(request: NextRequest) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;

  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { success: false, message: '缺少文件名参数' },
        { status: 400 }
      );
    }

    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: '文件不存在' },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);
    await recordAuditEvent({
      request,
      user: authResult.user,
      action: 'media.delete',
      resourceType: 'media',
      resourceId: safeFilename,
      metadata: { filename: safeFilename },
    });

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete image error:', error);
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
