import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';

// GET - public
export async function GET() {
  try {
    const result = await query(
      `SELECT t.id, t.name, t.slug, t.color, t.created_at,
              COUNT(p.id) as post_count
       FROM tags t
       LEFT JOIN post_tags pt ON t.id = pt.tag_id
       LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
       GROUP BY t.id, t.name, t.slug, t.color, t.created_at
       ORDER BY t.name ASC`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      { success: false, message: '获取标签列表失败' },
      { status: 500 }
    );
  }
}

// POST - authenticated
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

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

    const existCheck = await query('SELECT id FROM tags WHERE slug = $1', [slug]);
    if (existCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Slug已存在' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO tags (name, slug, color) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, colorValue]
    );

    return NextResponse.json(
      { success: true, message: '标签创建成功', data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json(
      { success: false, message: '创建标签失败' },
      { status: 500 }
    );
  }
}
