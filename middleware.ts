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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || request.url;
    return NextResponse.redirect(new URL('/admin/login', siteUrl));
  }

  const adminOnly = ['/admin/users', '/admin/settings', '/admin/integrations', '/admin/agent'];
  const editorial = ['/admin/categories', '/admin/tags', '/admin/comments', '/admin/projects'];
  const matches = (routes: string[]) => routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if ((matches(adminOnly) && user.role !== 'admin') || (matches(editorial) && !['admin', 'editor'].includes(user.role))) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
