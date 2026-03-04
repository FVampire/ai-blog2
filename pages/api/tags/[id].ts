import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authMiddleware } from '../../../lib/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: '无效的标签ID',
    });
  }

  // PUT - 更新标签
  if (req.method === 'PUT') {
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

      // 检查slug是否与其他标签冲突
      const existCheck = await query(
        'SELECT id FROM tags WHERE slug = $1 AND id != $2',
        [slug, id]
      );

      if (existCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Slug已被其他标签使用',
        });
      }

      const result = await query(
        'UPDATE tags SET name = $1, slug = $2, color = $3 WHERE id = $4 RETURNING *',
        [name, slug, colorValue, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '标签不存在',
        });
      }

      return res.status(200).json({
        success: true,
        message: '标签更新成功',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Update tag error:', error);
      return res.status(500).json({
        success: false,
        message: '更新标签失败',
      });
    }
  }

  // DELETE - 删除标签
  if (req.method === 'DELETE') {
    try {
      // 先删除关联关系
      await query('DELETE FROM post_tags WHERE tag_id = $1', [id]);

      // 删除标签
      const result = await query(
        'DELETE FROM tags WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '标签不存在',
        });
      }

      return res.status(200).json({
        success: true,
        message: '标签删除成功',
      });
    } catch (error) {
      console.error('Delete tag error:', error);
      return res.status(500).json({
        success: false,
        message: '删除标签失败',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: '方法不允许',
  });
}

export default authMiddleware(handler);
