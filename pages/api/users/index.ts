import { NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { requireRole, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { query } from '../../../lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create new user
    try {
      const { username, email, password, role = 'author', status = 'active' } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名、邮箱和密码为必填项',
        });
      }

      // Check if username or email already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await query(
        `INSERT INTO users (username, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, role, status, created_at`,
        [username, email, passwordHash, role, status]
      );

      return res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: {
          user: result.rows[0],
        },
      });
    } catch (error) {
      console.error('Create user error:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
      });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  }

  try {
    const { page = '1', limit = '10', search, role, status } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build query
    let queryText = `
      SELECT
        u.id, u.username, u.email, u.role, u.status, u.avatar_url,
        u.created_at,
        COUNT(p.id) as posts_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      queryText += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add role filter
    if (role) {
      queryText += ` AND u.role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    // Add status filter
    if (status) {
      queryText += ` AND u.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    queryText += `
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(parseInt(limit as string), offset);

    // Execute query
    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (u.username ILIKE $${countParamIndex} OR u.email ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (role) {
      countQuery += ` AND u.role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND u.status = $${countParamIndex}`;
      countParams.push(status);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return res.status(200).json({
      success: true,
      data: {
        users: result.rows.map(row => ({
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role,
          status: row.status,
          avatarUrl: row.avatar_url,
          postsCount: parseInt(row.posts_count),
          createdAt: row.created_at,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// Only admin can access users list
export default requireRole(['admin'])(handler);
