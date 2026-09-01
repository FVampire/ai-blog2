import { NextResponse } from 'next/server';

import { PostCategoryRepository } from '@/lib/repositories/PostCategoryRepository';

export async function GET() {
  try {
    const categories = await PostCategoryRepository.getAllWithPostCount();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get post categories error:', error);
    return NextResponse.json(
      { success: false, message: '获取专栏失败' },
      { status: 500 }
    );
  }
}
