import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authMiddleware } from '../../../lib/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - 获取所有标签（公开访问）
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT t.id, t.name, t.slug, t.color, t.created_at,
                COUNT(p.id) as post_count
         FROM tags t
         LEFT JOIN post_tags pt ON t.id = pt.tag_id
         LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
         GROUP BY t.id, t.name, t.slug, t.color, t.created_at
         ORDER BY t.name ASC`
      );

      return res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get tags error:', error);
      return res.status(500).json({
        success: false,
        message: '获取标签列表失败',
      });
    }
  }

  // POST - 创建标签
  if (req.method === 'POST') {
    try {
      const { name, slug, color } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: '标签名称和slug不能为空',
        });
      }

      // 验证颜色格式（可选）
      const colorValue = color || '#FF6B6B';
      if (colorValue && !/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
        return res.status(400).json({
          success: false,
          message: '颜色格式不正确，应为 #RRGGBB 格式',
        });
      }

      // 检查slug是否已存在
      const existCheck = await query(
        'SELECT id FROM tags WHERE slug = $1',
        [slug]
      );

      if (existCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Slug已存在',
        });
      }

      const result = await query(
        'INSERT INTO tags (name, slug, color) VALUES ($1, $2, $3) RETURNING *',
        [name, slug, colorValue]
      );

      return res.status(201).json({
        success: true,
        message: '标签创建成功',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Create tag error:', error);
      return res.status(500).json({
        success: false,
        message: '创建标签失败',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: '方法不允许',
  });
}

// 主路由处理函数 - 根据请求方法决定是否需要鉴权
export default async function mainHandler(req: NextApiRequest, res: NextApiResponse) {
  // GET 请求不需要鉴权，直接处理
  if (req.method === 'GET') {
    return handler(req, res);
  }

  // POST、PUT、DELETE 等请求需要鉴权
  return authMiddleware(handler)(req, res);
}
