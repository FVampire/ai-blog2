import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_TOKEN_COOKIE } from './lib/auth-cookie';
import { verifyEdgeToken } from './lib/edge-jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  const secret = process.env.JWT_SECRET;
  const user = token && secret ? await verifyEdgeToken(token, secret) : null;

  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
