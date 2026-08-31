import { NextRequest, NextResponse } from 'next/server';

/**
 * 综合搜索API - proxy to vector or text search
 */

export async function GET(request: NextRequest) {
  return handleSearch(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleSearch(request, 'POST');
}

async function handleSearch(request: NextRequest, method: string) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestBody = method === 'POST'
      ? await request.json().catch(() => ({} as Record<string, unknown>))
      : null;
    const type = method === 'GET'
      ? (searchParams.get('type') || 'auto')
      : (typeof requestBody?.type === 'string' ? requestBody.type : 'auto');

    const targetUrl = '/api/search/vector';

    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = request.headers.get('host') || 'localhost:3000';

    const url = new URL(targetUrl, `${protocol}://${host}`);

    // Copy search params
    searchParams.forEach((value, key) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    if (type === 'text') url.searchParams.set('mode', 'text');

    const forwardedBody = requestBody
      ? { ...requestBody, ...(type === 'text' ? { mode: 'text' } : {}) }
      : null;

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(forwardedBody ? { body: JSON.stringify(forwardedBody) } : {}),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error('Search API error:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { success: false, message: '搜索失败', error: message },
      { status: 500 }
    );
  }
}
