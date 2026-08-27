import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { PostRepository } from '@/lib/repositories/PostRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;
  const postId = parseInt(id, 10);
  if (Number.isNaN(postId)) {
    return NextResponse.json({ success: false, message: '无效的文章ID' }, { status: 400 });
  }

  try {
    const post = await PostRepository.getPostById(postId);
    if (!post) {
      return NextResponse.json({ success: false, message: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          imageUrl: post.imageUrl,
          status: post.status,
          views: post.views,
          author: { id: post.authorId, name: post.authorName },
          tags: post.tags,
          prev_post_id: post.prevPostId,
          next_post_id: post.nextPostId,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          publishedAt: post.publishedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;
  const postId = parseInt(id, 10);
  if (Number.isNaN(postId)) {
    return NextResponse.json({ success: false, message: '无效的文章ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const post = await PostRepository.updatePost(postId, {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      imageUrl: body.imageUrl,
      status: body.status,
      tagIds: body.tagIds,
      prevPostId: body.prevPostId ?? undefined,
      nextPostId: body.nextPostId ?? undefined,
    });

    return NextResponse.json({
      success: true,
      message: '文章更新成功',
      data: { post },
    });
  } catch (error) {
    console.error('Update post error:', error);
    const message = error instanceof Error ? error.message : '更新文章失败';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(_request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;
  const postId = parseInt(id, 10);
  if (Number.isNaN(postId)) {
    return NextResponse.json({ success: false, message: '无效的文章ID' }, { status: 400 });
  }

  try {
    await PostRepository.deletePost(postId);
    return NextResponse.json({ success: true, message: '文章删除成功' });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ success: false, message: '删除文章失败' }, { status: 500 });
  }
}
