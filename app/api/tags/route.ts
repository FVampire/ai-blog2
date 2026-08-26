import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { TagLegacyRepository } from '@/lib/repositories/TagLegacyRepository';

export async function GET() {
  try {
    const tags = await TagLegacyRepository.getAllTagsWithCount();
    // Admin UI expects post_count field name
    const data = tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      created_at: t.createdAt,
      post_count: t.postCount,
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      { success: false, message: '获取标签列表失败' },
      { status: 500 }
    );
  }
}

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
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
      return NextResponse.json(
        { success: false, message: '颜色格式不正确，应为 #RRGGBB 格式' },
        { status: 400 }
      );
    }

    const tag = await TagLegacyRepository.createTag({ name, slug, color: colorValue });
    return NextResponse.json(
      { success: true, message: '标签创建成功', data: tag },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create tag error:', error);
    const message = error instanceof Error ? error.message : '创建标签失败';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
