import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/lib/db';
import { generateEmbedding } from '@/lib/embedding';
import { VectorRepository } from '@/lib/repositories/VectorRepository';

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  author: string;
  date: string;
  tags: string[];
  views: number;
  similarity: number;
  matchedSnippets: string[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10') || 10;
  const threshold = parseFloat(searchParams.get('threshold') || '0.5') || 0.5;

  return handleVectorSearch(q, limit, threshold);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const q = body.q;
  const limit = parseInt(body.limit) || 10;
  const threshold = parseFloat(body.threshold) || 0.5;

  return handleVectorSearch(q, limit, threshold);
}

async function handleVectorSearch(q: string | null, limit: number, threshold: number) {
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return NextResponse.json(
      { success: false, message: '搜索关键词不能为空' },
      { status: 400 }
    );
  }

  const queryText = q.trim();

  try {
    let vectorSearchEnabled = true;
    try {
      const { rows } = await query(
        "SELECT value FROM settings WHERE key = 'ai_vector_search_enabled'"
      );
      if (rows.length > 0) {
        vectorSearchEnabled = rows[0].value === 'true';
      }
    } catch (e) {}

    if (!vectorSearchEnabled) {
      return await fallbackToTextSearch(queryText, limit);
    }

    const queryVectors = await generateEmbedding(queryText, queryText, queryText);

    if (!queryVectors) {
      return await fallbackToTextSearch(queryText, limit);
    }

    const vectorResults = await VectorRepository.search(queryText, queryVectors, {
      limit,
      threshold,
    });

    const results: SearchResult[] = vectorResults
      .map((result) => ({
        id: result.postId,
        title: result.title,
        slug: result.slug,
        excerpt: result.excerpt,
        image: result.imageUrl || undefined,
        author: result.authorName || '未知作者',
        date: new Date(result.publishedAt).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        tags: [],
        views: result.views,
        similarity: Math.round(result.similarity * 100) / 100,
        matchedSnippets: result.matchedSnippets,
      }))
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    return NextResponse.json({
      success: true,
      data: {
        query: queryText,
        results,
        total: results.length,
        searchType: 'vector',
      },
    });
  } catch (error: any) {
    console.error('Vector search error:', error);
    return NextResponse.json(
      { success: false, message: '搜索失败', error: error.message },
      { status: 500 }
    );
  }
}

async function fallbackToTextSearch(queryText: string, limit: number) {
  try {
    const { rows } = await query(
      `SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags,
        CASE
          WHEN p.title ILIKE $2 THEN 0.9
          WHEN p.excerpt ILIKE $2 THEN 0.7
          WHEN p.content ILIKE $2 THEN 0.5
          ELSE 0.3
        END as similarity
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = 'published'
        AND (p.title ILIKE $1 OR p.excerpt ILIKE $1 OR p.content ILIKE $1)
      GROUP BY p.id, u.username
      ORDER BY similarity DESC, p.published_at DESC
      LIMIT $3`,
      [`%${queryText}%`, `%${queryText}%`, limit]
    );

    const results: SearchResult[] = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      image: row.image_url || undefined,
      author: row.author_name || '未知作者',
      date: new Date(row.published_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      tags: row.tags || [],
      views: row.views,
      similarity: Math.round(row.similarity * 100) / 100,
      matchedSnippets: extractSnippets(row.title, row.excerpt, queryText),
    }));

    return NextResponse.json({
      success: true,
      data: {
        query: queryText,
        results,
        total: results.length,
        searchType: 'text',
      },
    });
  } catch (error: any) {
    console.error('Fallback text search error:', error);
    return NextResponse.json(
      { success: false, message: '搜索失败', error: error.message },
      { status: 500 }
    );
  }
}

function extractSnippets(title: string, excerpt: string, query: string): string[] {
  const snippets: string[] = [];
  const lowerQuery = query.toLowerCase();

  if (title.toLowerCase().includes(lowerQuery)) {
    snippets.push(title);
  }

  if (excerpt && excerpt.toLowerCase().includes(lowerQuery)) {
    const index = excerpt.toLowerCase().indexOf(lowerQuery);
    const start = Math.max(0, index - 50);
    const end = Math.min(excerpt.length, index + query.length + 100);
    let snippet = excerpt.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < excerpt.length) snippet = snippet + '...';
    snippets.push(snippet);
  }

  return snippets;
}
