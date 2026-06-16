import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError, getAuthUser } from '@/lib/auth-middleware-app';
import { query, getClient } from '@/lib/db';
import { generateEmbedding } from '@/lib/embedding';
import { VectorRepository } from '@/lib/repositories/VectorRepository';

// GET - serves both public (no auth) and admin (with auth) requests
export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  const searchParams = request.nextUrl.searchParams;

  if (user) {
    // Authenticated (admin) version
    return adminGetHandler(request, user, searchParams);
  } else {
    // Public version
    return publicGetHandler(searchParams);
  }
}

async function publicGetHandler(searchParams: URLSearchParams) {
  try {
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryText = `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = 'published'
    `;

    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (p.title ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY p.id, u.username
      ORDER BY p.published_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(parseInt(limit), offset);

    const result = await query(queryText, queryParams);

    let countQuery = 'SELECT COUNT(*) FROM posts p WHERE p.status = $1';
    const countParams: unknown[] = ['published'];

    if (search) {
      countQuery += ' AND (p.title ILIKE $2 OR EXISTS(SELECT 1 FROM users u WHERE u.id = p.author_id AND u.username ILIKE $2))';
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count as string);

    const posts = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      image: row.image_url || '',
      author: row.author_name,
      date: new Date(row.published_at as string).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      tags: row.tags,
    }));

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

async function adminGetHandler(request: NextRequest, user: { userId: number; username: string; role: string }, searchParams: URLSearchParams) {
  try {
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryText = `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.status, p.views, p.created_at, p.published_at,
        u.username as author_name, u.id as author_id,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE 1=1
    `;

    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      queryText += ` AND p.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (p.title ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY p.id, u.username, u.id
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(parseInt(limit), offset);

    const result = await query(queryText, queryParams);

    let countQuery = 'SELECT COUNT(*) FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE 1=1';
    const countParams: unknown[] = [];
    let countParamIndex = 1;

    if (status && status !== 'all') {
      countQuery += ` AND p.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (p.title ILIKE $${countParamIndex} OR u.username ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count as string);

    return NextResponse.json({
      success: true,
      data: {
        posts: result.rows.map((row: Record<string, unknown>) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          imageUrl: row.image_url,
          status: row.status,
          views: row.views,
          author: {
            id: row.author_id,
            name: row.author_name,
          },
          tags: row.tags,
          createdAt: row.created_at,
          publishedAt: row.published_at,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST - Create post (authenticated)
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const { title, slug, excerpt, content, imageUrl, status, tagIds } = body;
    const authorId = authResult.user.userId;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, message: '标题和slug不能为空' },
        { status: 400 }
      );
    }

    if (!authorId) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const existCheck = await query('SELECT id FROM posts WHERE slug = $1', [slug]);
    if (existCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Slug已存在' },
        { status: 400 }
      );
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      const insertResult = await client.query(
        `INSERT INTO posts (title, slug, excerpt, content, image_url, status, author_id, published_at)
         VALUES ($1, $2, $3, $4, $5, $6::text, $7, CASE WHEN $6 = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)
         RETURNING *`,
        [title, slug, excerpt || '', content || '', imageUrl || '', status || 'draft', authorId]
      );

      const newPost = insertResult.rows[0];

      if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
        const tagValues = tagIds.map((_: any, index: number) => `($1, $${index + 2})`).join(',');
        const tagParams = [newPost.id, ...tagIds];
        await client.query(
          `INSERT INTO post_tags (post_id, tag_id) VALUES ${tagValues}`,
          tagParams
        );
      }

      await client.query('COMMIT');

      if (status === 'published') {
        setTimeout(async () => {
          try {
            const vectors = await generateEmbedding(title, content || '', excerpt || '');
            if (vectors) {
              await VectorRepository.saveVectors(newPost.id, vectors);
            }
          } catch (vectorError) {
            console.error(`[Vector] Failed to generate embedding for post ${newPost.id}:`, vectorError);
          }
        }, 0);
      }

      return NextResponse.json(
        {
          success: true,
          message: '文章创建成功',
          data: { post: newPost },
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { success: false, message: '创建文章失败' },
      { status: 500 }
    );
  }
}
