import { NextRequest, NextResponse } from 'next/server';

import { requireAgentAuth } from '@/lib/auth-middleware-app';
import { generateSlug } from '@/lib/agent-utils';
import { ProjectRepository } from '@/lib/repositories/ProjectRepository';

/**
 * Agent API: Project management
 *
 * GET  /api/agent/projects - List all projects
 * POST /api/agent/projects - Create or register a project
 */
export async function GET(request: NextRequest) {
  const authResult = requireAgentAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const projects = await ProjectRepository.getAllProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('[Agent] List projects error:', error);
    return NextResponse.json(
      { success: false, message: '获取项目列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = requireAgentAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const {
      name,
      slug: customSlug,
      description,
      techStack = [],
      repoUrl,
      demoUrl,
      imageUrl,
      featured = false,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: '项目名称不能为空' },
        { status: 400 }
      );
    }

    const slug = customSlug || generateSlug(name);

    const existing = await ProjectRepository.getProjectBySlug(slug);
    if (existing) {
      return NextResponse.json({
        success: true,
        message: '项目已存在',
        data: existing,
      });
    }

    const project = await ProjectRepository.createProject({
      name,
      slug,
      description,
      techStack,
      repoUrl,
      demoUrl,
      imageUrl,
      featured,
    });

    const siteUrl = process.env.SITE_URL || '';
    const projectUrl = `/projects/${project.slug}`;

    return NextResponse.json({
      success: true,
      message: '项目已创建',
      data: {
        ...project,
        url: projectUrl,
        fullUrl: siteUrl ? `${siteUrl}${projectUrl}` : projectUrl,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Agent] Create project error:', error);
    const message = error instanceof Error ? error.message : '创建项目失败';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
