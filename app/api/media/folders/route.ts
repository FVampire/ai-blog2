import { NextRequest, NextResponse } from 'next/server';

import { recordAuditEvent } from '@/lib/audit-log';
import { requireRoles, isAuthError } from '@/lib/auth-middleware-app';
import {
  createMediaFolder,
  deleteMediaFolder,
  mediaPathToStoredUrl,
  MediaLibraryError,
  renameMediaFolder,
  resolveMediaFolder,
} from '@/lib/media-library';
import { countPostMediaReferences, renamePostMediaReferences } from '@/lib/media-post-references';

function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof MediaLibraryError) {
    return NextResponse.json(
      { success: false, message: error.message, code: error.code },
      { status: error.status },
    );
  }
  console.error(fallbackMessage, error);
  return NextResponse.json(
    { success: false, message: fallbackMessage, error: error instanceof Error ? error.message : '未知错误' },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;

  try {
    const { parent = '', name } = await request.json();
    const folder = await createMediaFolder(parent, name);
    await recordAuditEvent({
      request,
      user: authResult.user,
      action: 'media.folder.create',
      resourceType: 'media_folder',
      resourceId: folder.path,
      metadata: { parent, name: folder.name },
    });
    return NextResponse.json({ success: true, message: '文件夹创建成功', data: { folder } });
  } catch (error) {
    return errorResponse(error, '创建文件夹失败');
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;

  let renamed: Awaited<ReturnType<typeof renameMediaFolder>> | null = null;
  try {
    const { path, name } = await request.json();
    renamed = await renameMediaFolder(path, name);
    const updatedPosts = await renamePostMediaReferences(
      mediaPathToStoredUrl(renamed.oldPath),
      mediaPathToStoredUrl(renamed.newPath),
    );
    await recordAuditEvent({
      request,
      user: authResult.user,
      action: 'media.folder.rename',
      resourceType: 'media_folder',
      resourceId: renamed.newPath,
      metadata: { oldPath: renamed.oldPath, newPath: renamed.newPath, updatedPosts },
    });
    return NextResponse.json({ success: true, message: '文件夹重命名成功', data: renamed });
  } catch (error) {
    if (renamed) {
      try {
        await renameMediaFolder(renamed.newPath, renamed.oldPath.split('/').pop());
      } catch (rollbackError) {
        console.error('Rollback folder rename failed:', rollbackError);
      }
    }
    return errorResponse(error, '重命名文件夹失败');
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;

  try {
    const { path, recursive = false } = await request.json();
    const target = await resolveMediaFolder(path);
    const references = await countPostMediaReferences(mediaPathToStoredUrl(target.relativePath));
    if (references > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `该文件夹内有 ${references} 篇文章正在使用图片，不能删除`,
          code: 'FOLDER_IN_USE',
        },
        { status: 409 },
      );
    }

    const deleted = await deleteMediaFolder(path, Boolean(recursive));
    await recordAuditEvent({
      request,
      user: authResult.user,
      action: 'media.folder.delete',
      resourceType: 'media_folder',
      resourceId: deleted.deletedPath,
      metadata: { recursive: Boolean(recursive) },
    });
    return NextResponse.json({ success: true, message: '文件夹删除成功' });
  } catch (error) {
    return errorResponse(error, '删除文件夹失败');
  }
}
