/**
 * 向量搜索API
 * 提供基于Embedding的语义搜索功能
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { generateEmbedding } from '../../../lib/embedding';
import { VectorRepository } from '../../../lib/repositories/VectorRepository';
import { query } from '../../../lib/db';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  }

  try {
    // 获取查询参数
    const q = req.method === 'GET' ? req.query.q : req.body.q;
    const limit = parseInt((req.method === 'GET' ? req.query.limit : req.body.limit) as string) || 10;
    const threshold = parseFloat((req.method === 'GET' ? req.query.threshold : req.body.threshold) as string) || 0.5;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空',
      });
    }

    const queryText = q.trim();

    // 检查向量搜索是否启用
    let vectorSearchEnabled = true;
    try {
      const { rows } = await query(
        "SELECT value FROM settings WHERE key = 'ai_vector_search_enabled'"
      );
      if (rows.length > 0) {
        vectorSearchEnabled = rows[0].value === 'true';
      }
    } catch (e) {
      // 如果settings表不存在，继续使用向量搜索
    }

    // 如果向量搜索被禁用，回退到普通搜索
    if (!vectorSearchEnabled) {
      return await fallbackToTextSearch(queryText, limit, res);
    }

    // 生成查询向量的临时数据
    // 我们使用同一个查询文本作为标题、内容、摘要的查询（语义上等同）
    const queryVectors = await generateEmbedding(queryText, queryText, queryText);

    if (!queryVectors) {
      console.warn('[Vector Search] Embedding not available, falling back to text search');
      return await fallbackToTextSearch(queryText, limit, res);
    }

    // 执行向量搜索
    const vectorResults = await VectorRepository.search(queryText, queryVectors, {
      limit,
      threshold,
    });

    // 格式化结果并按相似度排序
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
        tags: [], // 向量搜索暂时不返回标签，如有需要可额外查询
        views: result.views,
        similarity: Math.round(result.similarity * 100) / 100, // 保留两位小数
        matchedSnippets: result.matchedSnippets,
      }))
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    return res.status(200).json({
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
    return res.status(500).json({
      success: false,
      message: '搜索失败',
      error: error.message,
    });
  }
}

/**
 * 回退到普通文本搜索
 */
async function fallbackToTextSearch(
  queryText: string,
  limit: number,
  res: NextApiResponse
): Promise<void> {
  try {
    const { rows } = await query(
      `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags,
        -- 简单的相似度计算（基于文本匹配）
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
      LIMIT $3
      `,
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

    return res.status(200).json({
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
    return res.status(500).json({
      success: false,
      message: '搜索失败',
      error: error.message,
    });
  }
}

/**
 * 提取匹配的文字片段
 */
function extractSnippets(title: string, excerpt: string, query: string): string[] {
  const snippets: string[] = [];
  const lowerQuery = query.toLowerCase();

  // 检查标题匹配
  if (title.toLowerCase().includes(lowerQuery)) {
    snippets.push(title);
  }

  // 检查摘要匹配
  if (excerpt && excerpt.toLowerCase().includes(lowerQuery)) {
    // 找到匹配位置并提取片段
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
