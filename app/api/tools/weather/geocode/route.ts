import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/tools/rate-limit';

const schema = z.string().trim().min(1).max(64);
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(`weather-geocode:${ip}`)) return NextResponse.json({ success: false, error: '请求过于频繁，请稍后再试。' }, { status: 429 });
  const parsed = schema.safeParse(request.nextUrl.searchParams.get('q'));
  if (!parsed.success) return NextResponse.json({ success: false, error: '请输入 1–64 个字符的城市名。' }, { status: 400 });
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', parsed.data); url.searchParams.set('count', '8'); url.searchParams.set('language', 'zh'); url.searchParams.set('format', 'json');
  try {
    const response = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const data = await response.json();
    return NextResponse.json({ success: true, data: data.results ?? [], meta: { provider: 'Open-Meteo', requestUrl: url.toString(), fetchedAt: new Date().toISOString(), cacheSeconds: 86400 } });
  } catch { return NextResponse.json({ success: false, error: '城市服务暂时不可用，请稍后重试。' }, { status: 502 }); }
}
