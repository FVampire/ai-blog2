import { NextRequest, NextResponse } from 'next/server';

import { requireAgentAuth } from '@/lib/auth-middleware-app';
import { generateSlug } from '@/lib/agent-utils';
import { BlogRepository } from '@/lib/repositories/BlogRepository';
import { query } from '@/lib/db';

/**
 * Agent API: One-click blog publishing
 *
 * POST /api/agent/publish
 * Headers: Authorization: Bearer <AGENT_API_KEY> or X-Agent-Key: <key>
 */
export async function POST(request: NextRequest) {
  const authResult = requireAgentAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      tags = [],
      status = 'published',
      slug: customSlug,
      imageUrl,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, message: '标题不能为空' },
        { status: 400 }
      );
    }

    const slug = customSlug || generateSlug(title);
    const tagNames = Array.isArray(tags) ? tags : [];

    const blog = await BlogRepository.createBlog({
      title,
      slug,
      excerpt: excerpt || title.slice(0, 200),
      content: content || '',
      imageUrl: imageUrl || '',
      published: status === 'published',
      tagNames,
    });

    const siteUrl = process.env.SITE_URL || '';
    const postUrl = `/posts/${blog.slug}`;

    return NextResponse.json({
      success: true,
      message: status === 'published' ? '文章已发布' : '文章已保存为草稿',
      data: {
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        status: blog.status,
        url: postUrl,
        fullUrl: siteUrl ? `${siteUrl}${postUrl}` : postUrl,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Agent] Publish error:', error);
    const message = error instanceof Error ? error.message : '发布失败';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authResult = requireAgentAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  let postCount = 0;
  try {
    const result = await query('SELECT COUNT(*) FROM blogs WHERE published = true');
    postCount = parseInt(result.rows[0].count as string);
  } catch {
    // DB may not be ready
  }

  return NextResponse.json({
    success: true,
    message: 'Agent Publish API is ready',
    data: {
      publishedPosts: postCount,
      endpoints: {
        publish: 'POST /api/agent/publish',
        upload: 'POST /api/agent/upload',
        projects: 'GET/POST /api/agent/projects',
      },
    },
  });
}
