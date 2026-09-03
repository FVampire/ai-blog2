import { NextRequest, NextResponse } from 'next/server';

import { recordAuditEvent } from '@/lib/audit-log';
import { requireRoles, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';
import { schedulePublishPipeline } from '@/lib/publish/pipeline';

const ALLOWED_STATUSES = new Set(['draft', 'published', 'archived']);

export async function POST(request: NextRequest) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const ids = Array.isArray(body.ids)
      ? [...new Set(body.ids.map(Number).filter((id: number) => Number.isInteger(id) && id > 0))]
      : [];
    if (ids.length === 0 || ids.length > 100) {
      return NextResponse.json({ success: false, message: '请选择 1 到 100 篇文章' }, { status: 400 });
    }

    if (body.action === 'delete') {
      const result = await query('DELETE FROM posts WHERE id = ANY($1::int[]) RETURNING id', [ids]);
      await recordAuditEvent({
        request,
        user: authResult.user,
        action: 'post.bulk_delete',
        resourceType: 'post',
        metadata: { requestedIds: ids, deletedIds: result.rows.map((row) => row.id) },
      });
      return NextResponse.json({ success: true, message: `已删除 ${result.rowCount} 篇文章`, data: { affected: result.rowCount } });
    }

    if (body.action === 'status' && ALLOWED_STATUSES.has(body.status)) {
      const before = await query('SELECT id, status FROM posts WHERE id = ANY($1::int[])', [ids]);
      const previous = new Map(before.rows.map((row: { id: number; status: string }) => [Number(row.id), row.status]));
      const result = await query(
        `UPDATE posts
         SET status = $1,
             published_at = CASE WHEN $1 = 'published' THEN COALESCE(published_at, CURRENT_TIMESTAMP) ELSE published_at END
         WHERE id = ANY($2::int[]) RETURNING id`,
        [body.status, ids],
      );
      await recordAuditEvent({
        request,
        user: authResult.user,
        action: 'post.bulk_status',
        resourceType: 'post',
        metadata: { ids: result.rows.map((row) => row.id), status: body.status },
      });
      if (body.status === 'published') {
        result.rows.forEach((row: { id: number }) => {
          schedulePublishPipeline(Number(row.id), { previousStatus: previous.get(Number(row.id)) || null });
        });
      }
      return NextResponse.json({ success: true, message: `已更新 ${result.rowCount} 篇文章`, data: { affected: result.rowCount } });
    }

    return NextResponse.json({ success: false, message: '无效的批量操作' }, { status: 400 });
  } catch (error) {
    console.error('Bulk post operation error:', error);
    return NextResponse.json({ success: false, message: '批量操作失败' }, { status: 500 });
  }
}
