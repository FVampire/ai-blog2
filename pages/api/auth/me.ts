import { NextApiResponse } from 'next';
import { authMiddleware, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { query } from '../../../lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  }

  try {
    // Get user details from database
    const result = await query(
      'SELECT id, username, email, role, status, avatar_url, bio, created_at FROM users WHERE id = $1',
      [req.user?.userId]
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
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

export default authMiddleware(handler);
