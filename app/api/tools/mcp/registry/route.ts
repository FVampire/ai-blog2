import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/tools/rate-limit';

const querySchema = z.object({
  search: z.string().trim().max(100).optional().default(''),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  cursor: z.string().max(500).optional(),
  name: z.string().trim().max(240).optional(),
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(`mcp-registry:${ip}`)) return NextResponse.json({ success: false, error: '请求过于频繁，请稍后再试。' }, { status: 429 });
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: '查询参数无效。' }, { status: 400 });
  const { search, limit, cursor, name } = parsed.data;
  const url = name
    ? new URL(`https://registry.modelcontextprotocol.io/v0.1/servers/${encodeURIComponent(name)}/versions`)
    : new URL('https://registry.modelcontextprotocol.io/v0.1/servers');
  if (!name) { if (search) url.searchParams.set('search', search); url.searchParams.set('limit', String(limit)); url.searchParams.set('version', 'latest'); if (cursor) url.searchParams.set('cursor', cursor); }
  try {
    const response = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Registry ${response.status}`);
    return NextResponse.json({ success: true, data: await response.json(), meta: { provider: 'Official MCP Registry', requestUrl: url.toString(), fetchedAt: new Date().toISOString(), cacheSeconds: 300 } });
  } catch { return NextResponse.json({ success: false, error: '官方 MCP Registry 暂时不可用。它不承诺持续可用性，请稍后重试。' }, { status: 502 }); }
}
