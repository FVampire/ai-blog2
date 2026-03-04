import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/db-adapter';

/**
 * Supabase 模式下的示例 API 路由
 *
 * 当 DATABASE_TYPE 设置为 "supabase" 时，
 * 此路由展示如何使用 createDatabaseAdapter 工厂函数
 * 传入 request 和 response 对象来创建 Supabase 客户端
 */

export async function GET(request: NextRequest) {
  try {
    // 为 Supabase 模式创建数据库适配器
    // 这将自动创建 Supabase 客户端并正确处理 cookies
    const dbAdapter = createDatabaseAdapter(request, NextResponse.next());

    // 获取客户端，其中包含 Supabase 客户端实例
    const client = await dbAdapter.getClient();

    // 获取 Supabase 客户端实例
    const supabase = (client as any).supabase;

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          message: 'Supabase client not available'
        },
        { status: 500 }
      );
    }

    // 使用 Supabase 客户端查询数据
    // 注意：在 Supabase 模式下，我们不使用原始 SQL 查询
    // 而是使用 Supabase 客户端提供的方法
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        image_url,
        views,
        published_at,
        users:author_id (username),
        tags:post_tags (tags (name))
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Database query failed',
          error: error.message
        },
        { status: 500 }
      );
    }

    // 格式化响应数据
    const posts = data.map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      image: post.image_url || '',
      author: post.users?.username || 'Unknown',
      date: post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '',
      tags: post.tags?.map((tagObj: any) => tagObj.tags?.name).filter(Boolean) || [],
    }));

    return NextResponse.json({
      success: true,
      data: posts
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// POST 请求示例 - 创建新文章
export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json();
    const { title, slug, excerpt, content, imageUrl } = body;

    // 验证必需字段
    if (!title || !slug || !content) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: title, slug, and content are required'
        },
        { status: 400 }
      );
    }

    // 为 Supabase 模式创建数据库适配器
    const dbAdapter = createDatabaseAdapter(request, NextResponse.next());

    // 获取客户端，其中包含 Supabase 客户端实例
    const client = await dbAdapter.getClient();

    // 获取 Supabase 客户端实例
    const supabase = (client as any).supabase;

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          message: 'Supabase client not available'
        },
        { status: 500 }
      );
    }

    // 使用 Supabase 客户端插入数据
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          slug,
          excerpt: excerpt || '',
          content,
          image_url: imageUrl || '',
          status: 'draft', // 默认为草稿状态
          views: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create post',
          error: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: data
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message
      },
      { status: 500 }
    );
  }
}