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
    const type = method === 'GET'
      ? (searchParams.get('type') || 'auto')
      : (await request.json()).type || 'auto';

    let targetUrl: string;

    if (type === 'vector') {
      targetUrl = '/api/search/vector';
    } else if (type === 'text') {
      targetUrl = '/api/posts';
    } else {
      targetUrl = '/api/search/vector';
    }

    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = request.headers.get('host') || 'localhost:3000';

    const url = new URL(targetUrl, `${protocol}://${host}`);

    // Copy search params
    searchParams.forEach((value, key) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!,
        }),
      },
      ...(method === 'POST' ? { body: JSON.stringify(await request.json().catch(() => ({}))) } : {}),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, message: '搜索失败', error: error.message },
      { status: 500 }
    );
  }
}
