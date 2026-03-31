/**
 * 单篇文章向量管理API
 * 用于为特定文章生成、更新或删除向量
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

  const { id } = req.query;
  const postId = parseInt(id as string);

  if (isNaN(postId)) {
    return res.status(400).json({
      success: false,
      message: '无效的文章ID',
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getVectorInfo(req, res, postId);
      case 'POST':
        return await generateVector(req, res, postId);
      case 'DELETE':
        return await deleteVector(req, res, postId);
      default:
        return res.status(405).json({
          success: false,
          message: '方法不允许',
        });
    }
  } catch (error: any) {
    console.error('Vector API error:', error);
    return res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message,
    });
  }
}

/**
 * 获取文章向量信息
 */
async function getVectorInfo(req: NextApiRequest, res: NextApiResponse, postId: number) {
  // 获取文章信息
  const { rows: postRows } = await query(
    'SELECT id, title, status FROM posts WHERE id = $1',
    [postId]
  );

  if (postRows.length === 0) {
    return res.status(404).json({
      success: false,
      message: '文章不存在',
    });
  }

  const post = postRows[0];
  const vectors = await VectorRepository.getVectors(postId);

  return res.status(200).json({
    success: true,
    data: {
      post: {
        id: post.id,
        title: post.title,
        status: post.status,
      },
      hasVectors: vectors !== null,
      vectors: vectors
        ? {
            model: vectors.model,
            contentDimension: vectors.content.length,
            excerptDimension: vectors.excerpt.length,
            titleDimension: vectors.title.length,
          }
        : null,
    },
  });
}

/**
 * 为文章生成向量
 */
async function generateVector(req: NextApiRequest, res: NextApiResponse, postId: number) {
  // 获取文章完整信息
  const { rows } = await query(
    'SELECT id, title, content, excerpt, status FROM posts WHERE id = $1',
    [postId]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: '文章不存在',
    });
  }

  const post = rows[0];

  // 如果文章不是发布状态，警告用户
  if (post.status !== 'published') {
    console.warn(`[Vector] Generating embedding for unpublished post ${postId}`);
  }

  // 生成向量
  const vectors = await generateEmbedding(post.title, post.content, post.excerpt);

  if (!vectors) {
    return res.status(500).json({
      success: false,
      message: '生成向量失败',
    });
  }

  // 保存向量
  await VectorRepository.saveVectors(postId, vectors);

  return res.status(200).json({
    success: true,
    message: '向量生成成功',
    data: {
      postId,
      model: vectors.model,
      dimensions: vectors.content.length,
    },
  });
}

/**
 * 删除文章向量
 */
async function deleteVector(req: NextApiRequest, res: NextApiResponse, postId: number) {
  await VectorRepository.deleteVectors(postId);

  return res.status(200).json({
    success: true,
    message: '向量已删除',
  });
}

export default authMiddleware(handler);
