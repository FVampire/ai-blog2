import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { ProjectRepository } from '@/lib/repositories/ProjectRepository';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(_request);
  if (isAuthError(authResult)) return authResult;

  try {
    const { id } = await params;
    const project = await ProjectRepository.getProjectById(parseInt(id));
    if (!project) {
      return NextResponse.json({ success: false, message: '项目不存在' }, { status: 404 });
    }

    const linkedPostIds = await ProjectRepository.getLinkedPostIds(project.id);
    const posts = await ProjectRepository.getProjectPosts(project.id);

    return NextResponse.json({
      success: true,
      data: { project, linkedPostIds, posts },
    });
  } catch (error) {
    console.error('Admin get project error:', error);
    return NextResponse.json({ success: false, message: '获取项目失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, techStack, repoUrl, demoUrl, imageUrl, featured, sortOrder, status, postIds } = body;

    const project = await ProjectRepository.updateProject(parseInt(id), {
      name, slug, description, techStack, repoUrl, demoUrl, imageUrl, featured, sortOrder, status,
    });

    if (postIds !== undefined && Array.isArray(postIds)) {
      await ProjectRepository.setLinkedPosts(project.id, postIds);
    }

    return NextResponse.json({ success: true, message: '项目更新成功', data: project });
  } catch (error) {
    console.error('Admin update project error:', error);
    const message = error instanceof Error ? error.message : '更新项目失败';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(_request);
  if (isAuthError(authResult)) return authResult;

  try {
    const { id } = await params;
    const deleted = await ProjectRepository.deleteProject(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ success: false, message: '项目不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: '项目已删除' });
  } catch (error) {
    console.error('Admin delete project error:', error);
    return NextResponse.json({ success: false, message: '删除项目失败' }, { status: 500 });
  }
}
