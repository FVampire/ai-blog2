import { NextResponse } from 'next/server';

import { ProjectRepository } from '@/lib/repositories/ProjectRepository';

export async function GET() {
  try {
    const projects = await ProjectRepository.getAllProjects({ status: 'active' });
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { success: false, message: '获取项目列表失败' },
      { status: 500 }
    );
  }
}
