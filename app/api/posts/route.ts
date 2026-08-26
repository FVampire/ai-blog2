import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError, getAuthUser } from '@/lib/auth-middleware-app';
import { BlogRepository } from '@/lib/repositories/BlogRepository';
import { TagRepository } from '@/lib/repositories/TagRepository';

// GET — public + admin; reads from `blogs` table
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
    const authorName = await BlogRepository.getAuthorName();

    const result = await BlogRepository.getPublicBlogs({ page, limit, search });

    const posts = result.data.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      image: row.imageUrl || '',
      author: authorName,
      date: new Date(row.updatedAt || row.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      tags: row.tags.map((t) => ({
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
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    let blogs = await BlogRepository.getAllBlogsAdmin();

    if (status && status !== 'all') {
      blogs = blogs.filter((b) => b.status === status);
    }
    if (search) {
      blogs = blogs.filter(
        (b) => b.title.toLowerCase().includes(search) || b.slug.toLowerCase().includes(search)
      );
    }

    const total = blogs.length;
    const offset = (page - 1) * limit;
    const pageData = blogs.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        posts: pageData.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          excerpt: b.excerpt,
          imageUrl: b.imageUrl,
          status: b.status,
          views: b.views,
          author: { id: 0, name: 'admin' },
          tags: (b as BlogWithTags).tagNames || [],
          createdAt: b.createdAt,
          publishedAt: b.published ? b.updatedAt : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

type BlogWithTags = Awaited<ReturnType<typeof BlogRepository.getAllBlogsAdmin>>[number] & {
  tagNames?: string[];
};

// POST — create in `blogs` table
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const { title, slug, excerpt, content, imageUrl, status, tagIds, tags } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, message: '标题和slug不能为空' },
        { status: 400 }
      );
    }

    let tagNames: string[] = tags || [];
    if (tagIds?.length) {
      const allTags = await TagRepository.getAllTags();
      tagNames = tagIds.map((id: number) => allTags.find((t) => t.id === id)?.name).filter(Boolean) as string[];
    }

    const blog = await BlogRepository.createBlog({
      title,
      slug,
      excerpt,
      content,
      imageUrl,
      published: status === 'published',
      tagNames,
    });

    return NextResponse.json(
      { success: true, message: '文章创建成功', data: { post: blog } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create post error:', error);
    const message = error instanceof Error ? error.message : '创建文章失败';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
