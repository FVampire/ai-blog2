import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { query } from '../../../lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: '无效的评论ID',
    });
  }

  try {
    // PUT - 更新评论状态
    if (req.method === 'PUT') {
      const { status } = req.body;

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态值',
        });
      }

      const result = await query(
        'UPDATE comments SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '评论不存在',
        });
      }

      return res.status(200).json({
        success: true,
        message: '评论状态更新成功',
        data: result.rows[0],
      });
    }

    // DELETE - 删除评论
    if (req.method === 'DELETE') {
      const result = await query(
        'DELETE FROM comments WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '评论不存在',
        });
      }

      return res.status(200).json({
        success: true,
        message: '评论删除成功',
      });
    }

    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  } catch (error) {
    console.error('Comment operation error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

export default authMiddleware(handler);
