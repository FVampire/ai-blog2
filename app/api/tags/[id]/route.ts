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
    const { name, slug, color } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: '标签名称和slug不能为空' },
        { status: 400 }
      );
    }

    const colorValue = color || '#FF6B6B';
    if (colorValue && !/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
      return NextResponse.json(
        { success: false, message: '颜色格式不正确，应为 #RRGGBB 格式' },
        { status: 400 }
      );
    }

    const existCheck = await query(
      'SELECT id FROM tags WHERE slug = $1 AND id != $2',
      [slug, id]
    );
    if (existCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Slug已被其他标签使用' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE tags SET name = $1, slug = $2, color = $3 WHERE id = $4 RETURNING *',
      [name, slug, colorValue, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '标签更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update tag error:', error);
    return NextResponse.json(
      { success: false, message: '更新标签失败' },
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
    await query('DELETE FROM post_tags WHERE tag_id = $1', [id]);

    const result = await query(
      'DELETE FROM tags WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '标签删除成功',
    });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json(
      { success: false, message: '删除标签失败' },
      { status: 500 }
    );
  }
}
