import { NextResponse } from 'next/server';

const DEFAULT_AVATAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" role="img" aria-label="默认头像">
  <rect width="80" height="80" rx="40" fill="#e8eef2"/>
  <circle cx="40" cy="30" r="14" fill="#9aabb8"/>
  <path d="M16 72c2-17 11-26 24-26s22 9 24 26" fill="#9aabb8"/>
</svg>
`.trim();

interface DefaultAvatarRouteProps {
  params: Promise<{ filename: string }>;
}

export async function GET(_request: Request, { params }: DefaultAvatarRouteProps) {
  const { filename } = await params;

  if (!/^default-avatar-[a-z0-9-]+\.png$/i.test(filename)) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(DEFAULT_AVATAR_SVG, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
