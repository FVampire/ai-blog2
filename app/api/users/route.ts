import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';

import { requireRoles, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryText = `
      SELECT
        u.id, u.username, u.email, u.role, u.status, u.avatar_url,
        u.created_at,
        COUNT(p.id) as posts_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      WHERE 1=1
    `;

    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      queryText += ` AND u.role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

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
    queryParams.push(parseInt(limit), offset);

    const result = await query(queryText, queryParams);

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

    return NextResponse.json({
      success: true,
      data: {
        users: result.rows.map((row: any) => ({
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
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  try {
    const { username, email, password, role = 'author', status = 'active' } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: '用户名、邮箱和密码为必填项' },
        { status: 400 }
      );
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: '用户名或邮箱已存在' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, status, created_at`,
      [username, email, passwordHash, role, status]
    );

    return NextResponse.json(
      {
        success: true,
        message: '用户创建成功',
        data: { user: result.rows[0] },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
