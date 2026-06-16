import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';

// GET - Get all comments (admin, authenticated)
export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '';
    let queryParams: unknown[] = [];

    if (status && status !== 'all') {
      whereClause = 'WHERE c.status = $1';
      queryParams = [status, limitNum, offset];
    } else {
      queryParams = [limitNum, offset];
    }

    const result = await query(
      `SELECT
        c.id, c.post_id, c.visitor_id, c.ip_address,
        c.content, c.status, c.created_at, c.updated_at,
        p.title as post_title, p.slug as post_slug
       FROM comments c
       LEFT JOIN posts p ON c.post_id = p.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${whereClause ? '2' : '1'} OFFSET $${whereClause ? '3' : '2'}`,
      queryParams
    );

    const countQuery = status && status !== 'all'
      ? 'SELECT COUNT(*) FROM comments c WHERE c.status = $1'
      : 'SELECT COUNT(*) FROM comments c';
    const countParams = status && status !== 'all' ? [status] : [];
    const countResult = await query(countQuery, countParams);

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
