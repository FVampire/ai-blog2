import { NextRequest, NextResponse } from 'next/server';

import { enforceRateLimit } from '@/lib/rate-limit-api';
import { PostRepository } from '@/lib/repositories/PostRepository';

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();
    const id = parseInt(String(postId), 10);

    if (!postId || Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, message: '文章ID不能为空' },
        { status: 400 }
      );
    }

    const rateLimited = enforceRateLimit(
      request,
      `posts:track-view:${id}`,
      1,
      10 * 60_000,
      '浏览记录过于频繁，请稍后再试'
    );
    if (rateLimited) return rateLimited;

    const views = await PostRepository.incrementViews(id);

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
