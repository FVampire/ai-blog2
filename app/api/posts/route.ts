import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError, getAuthUser } from '@/lib/auth-middleware-app';
import { PostRepository } from '@/lib/repositories/PostRepository';
import { TagRepository } from '@/lib/repositories/TagRepository';

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  const searchParams = request.nextUrl.searchParams;

  if (user) {
    return adminGetHandler(searchParams);
  }
  return publicGetHandler(searchParams);
}

async function publicGetHandler(searchParams: URLSearchParams) {
  try {
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;

    const result = await PostRepository.getPublicPosts({ page, limit, search });
    const fallbackAuthor = await PostRepository.getAuthorName();

    const posts = result.data.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      image: row.imageUrl || '',
      author: row.authorName || fallbackAuthor,
      date: new Date(row.publishedAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      tags: (row.tags as Array<{ name: string; slug: string; color?: string }>).map((t) => ({
        name: t.name,
        slug: t.slug,
        color: t.color || '#6C757D',
      })),
    }));

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

async function adminGetHandler(searchParams: URLSearchParams) {
  try {
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || undefined;

    const result = await PostRepository.getAdminPosts({ page, limit, status, search });

    return NextResponse.json({
      success: true,
      data: {
        posts: result.data.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          imageUrl: p.imageUrl,
          status: p.status,
          views: p.views,
          author: { id: p.authorId, name: p.authorName || 'admin' },
          tags: p.tags.map((t) => t.name),
          createdAt: p.createdAt,
          publishedAt: p.publishedAt,
        })),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const { title, slug, excerpt, content, imageUrl, status, tagIds } = body;
    const authorId = authResult.user.userId;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, message: '标题和slug不能为空' },
        { status: 400 }
      );
    }

    const post = await PostRepository.createPost({
      title,
      slug,
      excerpt,
      content,
      imageUrl,
      status: status || 'draft',
      authorId,
      tagIds,
    });

    return NextResponse.json(
      { success: true, message: '文章创建成功', data: { post } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create post error:', error);
    const message = error instanceof Error ? error.message : '创建文章失败';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
