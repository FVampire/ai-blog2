import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireRoles } from '@/lib/auth-middleware-app';
import { PostCategoryRepository } from '@/lib/repositories/PostCategoryRepository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ success: false, message: '无效的专栏 ID' }, { status: 400 });
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const slug = String(body.slug || '').trim().toLowerCase();
    const color = String(body.color || '#6C757D');
    if (!name || !slug || !/^[a-z0-9-]+$/.test(slug) || !/^#[0-9a-f]{6}$/i.test(color)) return NextResponse.json({ success: false, message: '请检查名称、Slug 和颜色格式' }, { status: 400 });
    const category = await PostCategoryRepository.update(id, { name, slug, description: String(body.description || '').trim(), color, sortOrder: Number(body.sortOrder) || 0 });
    if (!category) return NextResponse.json({ success: false, message: '专栏不存在' }, { status: 404 });
    return NextResponse.json({ success: true, message: '专栏已更新', data: category });
  } catch (error) {
    console.error('Update post category error:', error);
    return NextResponse.json({ success: false, message: '专栏名称或 Slug 已存在' }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireRoles(request, ['admin', 'editor']);
  if (isAuthError(authResult)) return authResult;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ success: false, message: '无效的专栏 ID' }, { status: 400 });
  const deleted = await PostCategoryRepository.delete(id);
  if (!deleted) return NextResponse.json({ success: false, message: '专栏不存在' }, { status: 404 });
  return NextResponse.json({ success: true, message: '专栏已删除，原文章已转为未归类' });
}
