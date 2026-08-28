import { NextResponse } from 'next/server';

import { ADMIN_TOKEN_COOKIE, expiredAdminCookieOptions } from '@/lib/auth-cookie';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: '已退出登录',
  });
  response.cookies.set(ADMIN_TOKEN_COOKIE, '', expiredAdminCookieOptions());
  return response;
}
