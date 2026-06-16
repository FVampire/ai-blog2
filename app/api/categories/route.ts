import { NextResponse } from 'next/server';

import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT t.id, t.name, t.slug, t.color, COUNT(pt.post_id) as post_count
       FROM tags t
       LEFT JOIN post_tags pt ON t.id = pt.tag_id
       LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
       GROUP BY t.id, t.name, t.slug, t.color
       HAVING COUNT(pt.post_id) > 0
       ORDER BY post_count DESC`
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, message: '获取分类失败' },
      { status: 500 }
    );
  }
}
