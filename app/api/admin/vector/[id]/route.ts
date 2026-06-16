import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';
import { generateEmbedding } from '@/lib/embedding';
import { VectorRepository } from '@/lib/repositories/VectorRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '需要管理员权限' },
      { status: 403 }
    );
  }

  const postId = parseInt((await params).id);
  if (isNaN(postId)) {
    return NextResponse.json(
      { success: false, message: '无效的文章ID' },
      { status: 400 }
    );
  }

  try {
    const { rows: postRows } = await query(
      'SELECT id, title, status FROM posts WHERE id = $1',
      [postId]
    );

    if (postRows.length === 0) {
      return NextResponse.json(
        { success: false, message: '文章不存在' },
        { status: 404 }
      );
    }

    const post = postRows[0];
    const vectors = await VectorRepository.getVectors(postId);

    return NextResponse.json({
      success: true,
      data: {
        post: { id: post.id, title: post.title, status: post.status },
        hasVectors: vectors !== null,
        vectors: vectors ? {
          model: vectors.model,
          contentDimension: vectors.content.length,
          excerptDimension: vectors.excerpt.length,
          titleDimension: vectors.title.length,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Get vector info error:', error);
    return NextResponse.json(
      { success: false, message: '操作失败', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '需要管理员权限' },
      { status: 403 }
    );
  }

  const postId = parseInt((await params).id);
  if (isNaN(postId)) {
    return NextResponse.json(
      { success: false, message: '无效的文章ID' },
      { status: 400 }
    );
  }

  try {
    const { rows } = await query(
      'SELECT id, title, content, excerpt, status FROM posts WHERE id = $1',
      [postId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '文章不存在' },
        { status: 404 }
      );
    }

    const post = rows[0];
    if (post.status !== 'published') {
      console.warn(`[Vector] Generating embedding for unpublished post ${postId}`);
    }

    const vectors = await generateEmbedding(post.title, post.content, post.excerpt);
    if (!vectors) {
      return NextResponse.json(
        { success: false, message: '生成向量失败' },
        { status: 500 }
      );
    }

    await VectorRepository.saveVectors(postId, vectors);

    return NextResponse.json({
      success: true, message: '向量生成成功',
      data: { postId, model: vectors.model, dimensions: vectors.content.length },
    });
  } catch (error: any) {
    console.error('Generate vector error:', error);
    return NextResponse.json(
      { success: false, message: '操作失败', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '需要管理员权限' },
      { status: 403 }
    );
  }

  const postId = parseInt((await params).id);
  if (isNaN(postId)) {
    return NextResponse.json(
      { success: false, message: '无效的文章ID' },
      { status: 400 }
    );
  }

  try {
    await VectorRepository.deleteVectors(postId);
    return NextResponse.json({ success: true, message: '向量已删除' });
  } catch (error: any) {
    console.error('Delete vector error:', error);
    return NextResponse.json(
      { success: false, message: '操作失败', error: error.message },
      { status: 500 }
    );
  }
}
