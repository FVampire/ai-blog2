import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';
import { generateEmbedding } from '@/lib/embedding';
import { VectorRepository } from '@/lib/repositories/VectorRepository';

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '需要管理员权限' },
      { status: 403 }
    );
  }

  try {
    const stats = await VectorRepository.getStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get vector stats error:', error);
    return NextResponse.json(
      { success: false, message: '操作失败', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '需要管理员权限' },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50') || 50;
    const dryRun = searchParams.get('dry_run') === 'true';

    const postsWithoutVectors = await VectorRepository.getPostsWithoutVectors(limit);

    if (postsWithoutVectors.length === 0) {
      return NextResponse.json({
        success: true, message: '所有文章都已生成向量',
        data: { processed: 0, total: 0, posts: [] },
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true, message: '模拟模式：以下文章将生成向量',
        data: {
          processed: 0, total: postsWithoutVectors.length,
          posts: postsWithoutVectors.map(p => ({ id: p.id, title: p.title })),
        },
      });
    }

    const results: { postId: number; success: boolean; error?: string }[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const post of postsWithoutVectors) {
      try {
        const vectors = await generateEmbedding(post.title, post.content, post.excerpt);
        if (vectors) {
          await VectorRepository.saveVectors(post.id, vectors);
          results.push({ postId: post.id, success: true });
          successCount++;
        } else {
          results.push({ postId: post.id, success: false, error: 'Failed to generate embedding vectors' });
          errorCount++;
        }
      } catch (error: any) {
        results.push({ postId: post.id, success: false, error: error.message });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功生成 ${successCount} 篇文章的向量，失败 ${errorCount} 篇`,
      data: {
        processed: successCount + errorCount, success: successCount,
        failed: errorCount, total: postsWithoutVectors.length, results,
      },
    });
  } catch (error: any) {
    console.error('Generate vectors error:', error);
    return NextResponse.json(
      { success: false, message: '操作失败', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '需要管理员权限' },
      { status: 403 }
    );
  }

  try {
    const confirmed = request.nextUrl.searchParams.get('confirm') === 'true';
    if (!confirmed) {
      return NextResponse.json(
        { success: false, message: '请添加 confirm=true 参数以确认删除所有向量' },
        { status: 400 }
      );
    }

    await query('DELETE FROM post_vectors');

    return NextResponse.json({ success: true, message: '所有向量已删除' });
  } catch (error: any) {
    console.error('Delete all vectors error:', error);
    return NextResponse.json(
      { success: false, message: '操作失败', error: error.message },
      { status: 500 }
    );
  }
}
