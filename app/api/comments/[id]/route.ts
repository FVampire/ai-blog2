import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const { status } = await request.json();

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: '无效的状态值' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE comments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '评论不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '评论状态更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const result = await query(
      'DELETE FROM comments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '评论不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '评论删除成功',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
