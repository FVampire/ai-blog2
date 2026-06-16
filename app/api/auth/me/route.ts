import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const result = await query(
      'SELECT id, username, email, role, status, avatar_url, bio, created_at FROM users WHERE id = $1',
      [authResult.user.userId]
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
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
