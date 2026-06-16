import { NextRequest, NextResponse } from 'next/server';

import { initializeDatabase } from '@/lib/datasource';
import { Post } from '@/lib/entities/Post';

/**
 * 示例 API 路由 - 使用 TypeORM
 */

export async function GET(request: NextRequest) {
  try {
    const ds = await initializeDatabase();
    const repo = ds.getRepository(Post);

    const posts = await repo.find({
      where: { status: 'published' },
      relations: { author: true, tags: true },
      order: { publishedAt: 'DESC' },
      take: 10,
    });

    const data = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      image: post.imageUrl || '',
      author: post.author?.username || 'Unknown',
      date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      }) : '',
      tags: post.tags?.map(t => t.name) || [],
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, imageUrl } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: title, slug, and content are required' },
        { status: 400 },
      );
    }

    const ds = await initializeDatabase();
    const repo = ds.getRepository(Post);
    const post = repo.create({
      title,
      slug,
      excerpt: excerpt || '',
      content,
      imageUrl: imageUrl || '',
      status: 'draft',
      views: 0,
    });

    const saved = await repo.save(post);

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      data: { post: saved },
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 },
    );
  }
}
