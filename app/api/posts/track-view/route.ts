import { NextRequest, NextResponse } from 'next/server';

import { BlogRepository } from '@/lib/repositories/BlogRepository';

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { success: false, message: '文章ID不能为空' },
        { status: 400 }
      );
    }

    const views = await BlogRepository.incrementViews(String(postId));

    return NextResponse.json({
      success: true,
      data: { views },
    });
  } catch (error) {
    console.error('Track view error:', error);
    const message = error instanceof Error ? error.message : '记录浏览失败';
    const status = message === '文章不存在' ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
