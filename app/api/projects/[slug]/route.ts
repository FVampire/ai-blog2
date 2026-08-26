import { NextRequest, NextResponse } from 'next/server';

import { ProjectRepository } from '@/lib/repositories/ProjectRepository';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const project = await ProjectRepository.getProjectBySlug(slug);

    if (!project) {
      return NextResponse.json(
        { success: false, message: '项目不存在' },
        { status: 404 }
      );
    }

    const posts = await ProjectRepository.getProjectPosts(project.id);

    return NextResponse.json({
      success: true,
      data: { project, posts },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { success: false, message: '获取项目详情失败' },
      { status: 500 }
    );
  }
}
