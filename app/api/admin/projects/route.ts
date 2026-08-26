import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { ProjectRepository } from '@/lib/repositories/ProjectRepository';

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const projects = await ProjectRepository.getAllProjectsAdmin();
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('Admin get projects error:', error);
    return NextResponse.json({ success: false, message: '获取项目列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const { name, slug, description, techStack, repoUrl, demoUrl, imageUrl, featured, sortOrder, postIds } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, message: '项目名称和 slug 不能为空' }, { status: 400 });
    }

    const project = await ProjectRepository.createProject({
      name,
      slug,
      description,
      techStack: techStack || [],
      repoUrl,
      demoUrl,
      imageUrl,
      featured,
      sortOrder,
    });

    if (postIds && Array.isArray(postIds) && postIds.length > 0) {
      await ProjectRepository.setLinkedPosts(project.id, postIds);
    }

    return NextResponse.json({ success: true, message: '项目创建成功', data: project }, { status: 201 });
  } catch (error) {
    console.error('Admin create project error:', error);
    const message = error instanceof Error ? error.message : '创建项目失败';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
