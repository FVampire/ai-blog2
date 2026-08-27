import { NextRequest, NextResponse } from 'next/server';

import { requireAgentAuth } from '@/lib/auth-middleware-app';
import { generateSlug, resolveTagIds } from '@/lib/agent-utils';
import { PostRepository } from '@/lib/repositories/PostRepository';
import { TagRepository } from '@/lib/repositories/TagRepository';
import { query } from '@/lib/db';

const DEFAULT_AUTHOR_ID = parseInt(process.env.AGENT_AUTHOR_ID || '1', 10);

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

    let tagIds: number[] = [];
    if (tags.length > 0) {
      tagIds = await resolveTagIds(tags, TagRepository, TagRepository.createTag);
    }

    const post = await PostRepository.createPost({
      title,
      slug,
      excerpt: excerpt || title.slice(0, 200),
      content: content || '',
      imageUrl: imageUrl || '',
      status: status as 'draft' | 'published' | 'archived',
      authorId: DEFAULT_AUTHOR_ID,
      tagIds,
    });

    const siteUrl = process.env.SITE_URL || '';
    const postUrl = `/posts/${post.slug}`;

    return NextResponse.json({
      success: true,
      message: status === 'published' ? '文章已发布' : '文章已保存为草稿',
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        status: post.status,
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
    const result = await query('SELECT COUNT(*) FROM posts WHERE status = $1', ['published']);
    postCount = parseInt(result.rows[0].count as string, 10);
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
