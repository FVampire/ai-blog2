import { NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { requireRole, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { query } from '../../../lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: '无效的用户ID',
    });
  }

  try {
    if (req.method === 'GET') {
      // Get single user
      const result = await query(
        `
        SELECT
          u.id, u.username, u.email, u.role, u.status, u.avatar_url, u.bio, u.created_at,
          COUNT(p.id) as posts_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        WHERE u.id = $1
        GROUP BY u.id
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        });
      }

      const user = result.rows[0];

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            postsCount: parseInt(user.posts_count),
            createdAt: user.created_at,
          },
        },
      });
    } else if (req.method === 'PUT') {
      // Update user
      const { username, email, role, status, avatarUrl, bio, password } = req.body;

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (username) {
        updates.push(`username = $${paramIndex}`);
        values.push(username);
        paramIndex++;
      }

      if (email) {
        updates.push(`email = $${paramIndex}`);
        values.push(email);
        paramIndex++;
      }

      if (role) {
        updates.push(`role = $${paramIndex}`);
        values.push(role);
        paramIndex++;
      }

      if (status) {
        updates.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }

      if (avatarUrl !== undefined) {
        updates.push(`avatar_url = $${paramIndex}`);
        values.push(avatarUrl);
        paramIndex++;
      }

      if (bio !== undefined) {
        updates.push(`bio = $${paramIndex}`);
        values.push(bio);
        paramIndex++;
      }

      // Hash password if provided
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        updates.push(`password_hash = $${paramIndex}`);
        values.push(passwordHash);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有提供要更新的字段',
        });
      }

      values.push(id);

      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        });
      }

      return res.status(200).json({
        success: true,
        message: '用户更新成功',
        data: {
          user: result.rows[0],
        },
      });
    } else if (req.method === 'DELETE') {
      // Delete user
      const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        });
      }

      return res.status(200).json({
        success: true,
        message: '用户删除成功',
      });
    } else {
      return res.status(405).json({
        success: false,
        message: '方法不允许',
      });
    }
  } catch (error) {
    console.error('User operation error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// Only admin can manage users
export default requireRole(['admin'])(handler);
