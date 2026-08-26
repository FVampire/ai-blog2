import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { BlogRepository } from '@/lib/repositories/BlogRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const blog = await BlogRepository.getBlogById(id);
    if (!blog) {
      return NextResponse.json({ success: false, message: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          imageUrl: blog.imageUrl,
          status: blog.status,
          views: blog.views,
          author: { id: 0, name: await BlogRepository.getAuthorName() },
          tags: blog.tags,
          prev_post_id: blog.prevBlogId,
          next_post_id: blog.nextBlogId,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
          publishedAt: blog.published ? blog.updatedAt : null,
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

  try {
    const body = await request.json();
    const blog = await BlogRepository.updateBlog(id, {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      imageUrl: body.imageUrl,
      status: body.status,
      prevBlogId: body.prevPostId ?? body.prevBlogId,
      nextBlogId: body.nextPostId ?? body.nextBlogId,
    });

    return NextResponse.json({
      success: true,
      message: '文章更新成功',
      data: { post: blog },
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

  try {
    await BlogRepository.deleteBlog(id);
    return NextResponse.json({ success: true, message: '文章删除成功' });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ success: false, message: '删除文章失败' }, { status: 500 });
  }
}
