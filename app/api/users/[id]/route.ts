import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';

import { requireRoles, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const result = await query(
      `SELECT
        u.id, u.username, u.email, u.role, u.status, u.avatar_url, u.bio, u.created_at,
        COUNT(p.id) as posts_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      WHERE u.id = $1
      GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
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
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const body = await request.json();
    const { username, email, role, status, avatarUrl, bio, password } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (username) { updates.push(`username = $${paramIndex}`); values.push(username); paramIndex++; }
    if (email) { updates.push(`email = $${paramIndex}`); values.push(email); paramIndex++; }
    if (role) { updates.push(`role = $${paramIndex}`); values.push(role); paramIndex++; }
    if (status) { updates.push(`status = $${paramIndex}`); values.push(status); paramIndex++; }
    if (avatarUrl !== undefined) { updates.push(`avatar_url = $${paramIndex}`); values.push(avatarUrl); paramIndex++; }
    if (bio !== undefined) { updates.push(`bio = $${paramIndex}`); values.push(bio); paramIndex++; }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramIndex}`);
      values.push(passwordHash);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有提供要更新的字段' },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '用户更新成功',
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireRoles(request, ['admin']);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
