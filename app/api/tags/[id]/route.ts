import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { TagRepository } from '@/lib/repositories/TagRepository';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;
  const tagId = parseInt(id, 10);
  if (Number.isNaN(tagId)) {
    return NextResponse.json({ success: false, message: '无效的标签ID' }, { status: 400 });
  }

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

    const tag = await TagRepository.updateTag(tagId, {
      name,
      slug,
      color: colorValue,
    });

    return NextResponse.json({
      success: true,
      message: '标签更新成功',
      data: tag,
    });
  } catch (error) {
    console.error('Update tag error:', error);
    const message = error instanceof Error ? error.message : '更新标签失败';
    const status = message === '标签不存在' ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;
  const tagId = parseInt(id, 10);
  if (Number.isNaN(tagId)) {
    return NextResponse.json({ success: false, message: '无效的标签ID' }, { status: 400 });
  }

  try {
    await TagRepository.deleteTag(tagId);
    return NextResponse.json({ success: true, message: '标签删除成功' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ success: false, message: '删除标签失败' }, { status: 500 });
  }
}
