import { NextResponse } from 'next/server';

import { TagLegacyRepository } from '@/lib/repositories/TagLegacyRepository';

export async function GET() {
  try {
    const tags = await TagLegacyRepository.getPopularTags(20);
    const data = tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      post_count: t.postCount,
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, message: '获取分类失败' },
      { status: 500 }
    );
  }
}
