import { NextRequest, NextResponse } from 'next/server';

import { requireRoles, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';

// GET - Get all comments (admin, authenticated)
export async function GET(request: NextRequest) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const search = searchParams.get('search')?.trim() || '';
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const filters: unknown[] = [];
    if (status && status !== 'all') { filters.push(status); conditions.push(`c.status = $${filters.length}`); }
    if (search) { filters.push(`%${search}%`); conditions.push(`p.title ILIKE $${filters.length}`); }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const queryParams = [...filters, limitNum, offset];

    const result = await query(
      `SELECT
        c.id, c.post_id, c.visitor_id, c.ip_address,
        c.content, c.status, c.created_at, c.updated_at,
        p.title as post_title, p.slug as post_slug
       FROM comments c
       LEFT JOIN posts p ON c.post_id = p.id
       ${whereClause}
       ORDER BY CASE WHEN c.status = 'pending' THEN 0 ELSE 1 END, c.created_at DESC
       LIMIT $${filters.length + 1} OFFSET $${filters.length + 2}`,
      queryParams
    );

    const countResult = await query(`SELECT COUNT(*) FROM comments c LEFT JOIN posts p ON c.post_id = p.id ${whereClause}`, filters);

    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Admin comments API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;
  try {
    const { ids, status } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0 || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ success: false, message: '请选择评论和有效操作' }, { status: 400 });
    }
    const normalizedIds = ids.map(Number).filter(Number.isInteger);
    if (normalizedIds.length !== ids.length) return NextResponse.json({ success: false, message: '评论 ID 无效' }, { status: 400 });
    const result = await query('UPDATE comments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2::int[]) RETURNING id', [status, normalizedIds]);
    return NextResponse.json({ success: true, message: `已更新 ${result.rows.length} 条评论`, data: { updated: result.rows.length } });
  } catch (error) {
    console.error('Bulk update comments error:', error);
    return NextResponse.json({ success: false, message: '批量操作失败' }, { status: 500 });
  }
}
