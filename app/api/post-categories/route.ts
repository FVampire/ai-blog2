import { NextRequest, NextResponse } from 'next/server';

import { PostCategoryRepository } from '@/lib/repositories/PostCategoryRepository';
import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';

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

export async function POST(request: NextRequest) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const slug = String(body.slug || '').trim().toLowerCase();
    const color = String(body.color || '#6C757D');
    if (!name || !slug) return NextResponse.json({ success: false, message: '专栏名称和 Slug 不能为空' }, { status: 400 });
    if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ success: false, message: 'Slug 只能包含小写字母、数字和连字符' }, { status: 400 });
    if (!/^#[0-9a-f]{6}$/i.test(color)) return NextResponse.json({ success: false, message: '颜色格式无效' }, { status: 400 });
    const category = await PostCategoryRepository.create({ name, slug, description: String(body.description || '').trim(), color, sortOrder: Number(body.sortOrder) || 0 });
    return NextResponse.json({ success: true, message: '专栏已创建', data: category }, { status: 201 });
  } catch (error) {
    console.error('Create post category error:', error);
    return NextResponse.json({ success: false, message: '专栏名称或 Slug 已存在' }, { status: 409 });
  }
}
