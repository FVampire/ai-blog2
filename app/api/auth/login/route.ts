import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';

import { ADMIN_TOKEN_COOKIE, adminCookieOptions } from '@/lib/auth-cookie';
import { query } from '@/lib/db';
import { generateToken } from '@/lib/jwt';
import { enforceRateLimit } from '@/lib/rate-limit-api';

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'auth:login',
    10,
    15 * 60_000,
    '登录尝试过于频繁，请稍后再试'
  );
  if (rateLimited) return rateLimited;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '请提供用户名和密码' },
        { status: 400 }
      );
    }

    const result = await query(
      'SELECT id, username, email, password_hash, role, status FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: '账户已被禁用' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
    response.cookies.set(ADMIN_TOKEN_COOKIE, token, adminCookieOptions());
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
