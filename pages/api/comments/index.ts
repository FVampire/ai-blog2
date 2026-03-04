import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { query } from '../../../lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // GET - 获取所有评论（管理后台）
    if (req.method === 'GET') {
      const { status, page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // 构建查询条件
      let whereClause = '';
      let queryParams: any[] = [];

      if (status && status !== 'all') {
        whereClause = 'WHERE c.status = $1';
        queryParams = [status, limitNum, offset];
      } else {
        queryParams = [limitNum, offset];
      }

      // 查询评论
      const result = await query(
        `SELECT
          c.id, c.post_id, c.visitor_id, c.ip_address,
          c.content, c.status, c.created_at, c.updated_at,
          p.title as post_title, p.slug as post_slug
         FROM comments c
         LEFT JOIN posts p ON c.post_id = p.id
         ${whereClause}
         ORDER BY c.created_at DESC
         LIMIT $${whereClause ? '2' : '1'} OFFSET $${whereClause ? '3' : '2'}`,
        queryParams
      );

      // 获取总数
      const countQuery = status && status !== 'all'
        ? 'SELECT COUNT(*) FROM comments c WHERE c.status = $1'
        : 'SELECT COUNT(*) FROM comments c';
      const countParams = status && status !== 'all' ? [status] : [];
      const countResult = await query(countQuery, countParams);

      const total = parseInt(countResult.rows[0].count);

      return res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  } catch (error) {
    console.error('Admin comments API error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

export default authMiddleware(handler);
