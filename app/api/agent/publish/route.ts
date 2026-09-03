import { NextRequest, NextResponse } from 'next/server';

import { DEFAULT_AUTHOR_ID, publishPostFromAgent } from '@/lib/agent/publish-post';
import { recordAuditEvent } from '@/lib/audit-log';
import { requireAgentAuth } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';
import { schedulePublishPipeline } from '@/lib/publish/pipeline';
import { PostRepository } from '@/lib/repositories/PostRepository';
import { SeriesRepository } from '@/lib/repositories/SeriesRepository';

export async function POST(request: NextRequest) {
  const authResult = requireAgentAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const result = await publishPostFromAgent({
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      tags: body.tags,
      status: body.status,
      slug: body.slug,
      imageUrl: body.imageUrl,
      projectSlug: body.projectSlug,
      seriesSlug: body.seriesSlug,
    });

    await recordAuditEvent({
      request,
      user: { userId: DEFAULT_AUTHOR_ID, username: 'Agent', email: '', role: 'agent' },
      action: 'agent.post.publish',
      resourceType: 'post',
      resourceId: result.post.id,
      metadata: { title: result.post.title, slug: result.post.slug, status: result.post.status },
    });

    if (result.post.status === 'published') {
      schedulePublishPipeline(result.post.id, { previousStatus: 'draft' });
    }

    return NextResponse.json({
      success: true,
      message: result.post.status === 'published' ? '文章已发布' : '文章已保存为草稿',
      data: {
        id: result.post.id,
        slug: result.post.slug,
        title: result.post.title,
        status: result.post.status,
        url: result.url,
        fullUrl: result.fullUrl,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Agent] Publish error:', error);
    const message = error instanceof Error ? error.message : '发布失败';
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  }
}

/**
 * Update the previous/next links for a post created by an Agent.
 * Keeping this operation behind AGENT_API_KEY lets publishing clients build a
 * series after all post IDs are known, without requiring an admin session.
 */
export async function PUT(request: NextRequest) {
  const authResult = requireAgentAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const postId = Number(body.id);
    const prevPostId = body.prevPostId === undefined ? undefined : Number(body.prevPostId);
    const nextPostId = body.nextPostId === undefined ? undefined : Number(body.nextPostId);

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json(
        { success: false, message: '文章 ID 无效' },
        { status: 400 }
      );
    }
    if (
      (prevPostId !== undefined && (!Number.isInteger(prevPostId) || prevPostId <= 0)) ||
      (nextPostId !== undefined && (!Number.isInteger(nextPostId) || nextPostId <= 0))
    ) {
      return NextResponse.json(
        { success: false, message: '上一篇或下一篇文章 ID 无效' },
        { status: 400 }
      );
    }
    if (prevPostId === undefined && nextPostId === undefined) {
      return NextResponse.json(
        { success: false, message: '请提供 prevPostId 或 nextPostId' },
        { status: 400 }
      );
    }
    if (prevPostId === postId || nextPostId === postId) {
      return NextResponse.json(
        { success: false, message: '文章不能关联自身' },
        { status: 400 }
      );
    }

    const post = await PostRepository.updatePost(postId, { prevPostId, nextPostId });
    await SeriesRepository.ensureForLinkedPost(post.id);
    await recordAuditEvent({
      request,
      user: { userId: DEFAULT_AUTHOR_ID, username: 'Agent', email: '', role: 'agent' },
      action: 'agent.post.relate',
      resourceType: 'post',
      resourceId: post.id,
      metadata: { prevPostId: post.prevPostId || null, nextPostId: post.nextPostId || null },
    });
    return NextResponse.json({
      success: true,
      message: '文章关系已更新',
      data: {
        id: post.id,
        prevPostId: post.prevPostId,
        nextPostId: post.nextPostId,
      },
    });
  } catch (error) {
    console.error('[Agent] Update post relations error:', error);
    const message = error instanceof Error ? error.message : '更新文章关系失败';
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
        mcp: 'POST /api/mcp',
      },
    },
  });
}
