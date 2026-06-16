import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { success: false, message: '文章ID不能为空' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE posts SET views = views + 1 WHERE id = $1 RETURNING views',
      [postId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '文章不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { views: result.rows[0].views },
    });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json(
      { success: false, message: '记录浏览失败' },
      { status: 500 }
    );
  }
}
