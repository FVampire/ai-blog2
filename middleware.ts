import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_TOKEN_COOKIE } from './lib/auth-cookie';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (!request.cookies.get(ADMIN_TOKEN_COOKIE)?.value) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
