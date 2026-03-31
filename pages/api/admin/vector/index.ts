/**
 * 向量管理API
 * 用于后台管理文章向量数据
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { VectorRepository } from '../../../../lib/repositories/VectorRepository';
import { generateEmbedding } from '../../../../lib/embedding';
import { query } from '../../../../lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // 检查用户权限（仅管理员）
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限',
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getVectorStats(req, res);
      case 'POST':
        return await generateMissingVectors(req, res);
      case 'DELETE':
        return await deleteAllVectors(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: '方法不允许',
        });
    }
  } catch (error: any) {
    console.error('Vector admin API error:', error);
    return res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message,
    });
  }
}

/**
 * 获取向量统计信息
 */
async function getVectorStats(req: NextApiRequest, res: NextApiResponse) {
  const stats = await VectorRepository.getStats();

  return res.status(200).json({
    success: true,
    data: stats,
  });
}

/**
 * 为缺失向量的文章生成向量
 */
async function generateMissingVectors(req: NextApiRequest, res: NextApiResponse) {
  const limit = parseInt(req.query.limit as string) || 50;
  const dryRun = req.query.dry_run === 'true';

  // 获取没有向量的文章
  const postsWithoutVectors = await VectorRepository.getPostsWithoutVectors(limit);

  if (postsWithoutVectors.length === 0) {
    return res.status(200).json({
      success: true,
      message: '所有文章都已生成向量',
      data: {
        processed: 0,
        total: 0,
        posts: [],
      },
    });
  }

  if (dryRun) {
    return res.status(200).json({
      success: true,
      message: '模拟模式：以下文章将生成向量',
      data: {
        processed: 0,
        total: postsWithoutVectors.length,
        posts: postsWithoutVectors.map(p => ({ id: p.id, title: p.title })),
      },
    });
  }

  // 批量生成向量
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
        console.log(`[Vector] Generated embedding for post ${post.id}: ${post.title}`);
      } else {
        results.push({
          postId: post.id,
          success: false,
          error: 'Failed to generate embedding vectors',
        });
        errorCount++;
      }
    } catch (error: any) {
      results.push({
        postId: post.id,
        success: false,
        error: error.message,
      });
      errorCount++;
      console.error(`[Vector] Failed to generate embedding for post ${post.id}:`, error);
    }
  }

  return res.status(200).json({
    success: true,
    message: `成功生成 ${successCount} 篇文章的向量，失败 ${errorCount} 篇`,
    data: {
      processed: successCount + errorCount,
      success: successCount,
      failed: errorCount,
      total: postsWithoutVectors.length,
      results,
    },
  });
}

/**
 * 删除所有向量（谨慎使用）
 */
async function deleteAllVectors(req: NextApiRequest, res: NextApiResponse) {
  const confirmed = req.query.confirm === 'true';

  if (!confirmed) {
    return res.status(400).json({
      success: false,
      message: '请添加 confirm=true 参数以确认删除所有向量',
    });
  }

  await query('DELETE FROM post_vectors');

  return res.status(200).json({
    success: true,
    message: '所有向量已删除',
  });
}

export default authMiddleware(handler);
