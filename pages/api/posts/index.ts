import { NextApiRequest, NextApiResponse } from 'next';
import { AuthenticatedRequest, authMiddleware } from '../../../lib/auth-middleware';
import { query, getClient } from '../../../lib/db';

// 公开的 GET 请求处理函数（不需要鉴权）
async function publicGetHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { page = '1', limit = '10', search } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // 前台只能查看已发布的文章
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

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add search filter
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
    queryParams.push(parseInt(limit as string), offset);

    // Execute query
    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM posts p WHERE p.status = $1';
    const countParams: any[] = ['published'];

    if (search) {
      countQuery += ' AND (p.title ILIKE $2 OR EXISTS(SELECT 1 FROM users u WHERE u.id = p.author_id AND u.username ILIKE $2))';
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Format response for frontend
    const posts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      image: row.image_url || '',
      author: row.author_name,
      date: new Date(row.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      tags: row.tags,
    }));

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // GET - 获取文章列表（需要鉴权的后台版本）
  if (req.method === 'GET') {
    try {
    const { page = '1', limit = '10', status, search } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build query
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

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add status filter
    if (status && status !== 'all') {
      queryText += ` AND p.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Add search filter
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
    queryParams.push(parseInt(limit as string), offset);

    // Execute query
    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE 1=1';
    const countParams: any[] = [];
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
    const total = parseInt(countResult.rows[0].count);

    return res.status(200).json({
      success: true,
      data: {
        posts: result.rows.map(row => ({
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
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
    } catch (error) {
      console.error('Get posts error:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
      });
    }
  }

  // POST - 创建文章
  if (req.method === 'POST') {
    try {
      const { title, slug, excerpt, content, imageUrl, status, tagIds } = req.body;
      const authorId = req.user?.userId;

      if (!title || !slug) {
        return res.status(400).json({
          success: false,
          message: '标题和slug不能为空',
        });
      }

      if (!authorId) {
        return res.status(401).json({
          success: false,
          message: '未授权',
        });
      }

      // 检查slug是否已存在
      const existCheck = await query('SELECT id FROM posts WHERE slug = $1', [slug]);
      if (existCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Slug已存在',
        });
      }

      const client = await getClient();

      try {
        await client.query('BEGIN');
        console.log(req.body);
        // 创建文章
        const insertResult = await client.query(
          `
          INSERT INTO posts (title, slug, excerpt, content, image_url, status, author_id, published_at)
          VALUES ($1, $2, $3, $4, $5, $6::text, $7, CASE WHEN $6 = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)
          RETURNING *
          `,
          [title, slug, excerpt || '', content || '', imageUrl || '', status || 'draft', authorId]
        );

        const newPost = insertResult.rows[0];

        // 关联标签
        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
          const tagValues = tagIds.map((tagId, index) => `($1, $${index + 2})`).join(',');
          const tagParams = [newPost.id, ...tagIds];
          await client.query(
            `INSERT INTO post_tags (post_id, tag_id) VALUES ${tagValues}`,
            tagParams
          );
        }

        await client.query('COMMIT');

        return res.status(201).json({
          success: true,
          message: '文章创建成功',
          data: {
            post: newPost,
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Create post error:', error);
      return res.status(500).json({
        success: false,
        message: '创建文章失败',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: '方法不允许',
  });
}

// 主路由处理函数 - 根据请求方法决定是否需要鉴权
export default async function mainHandler(req: NextApiRequest, res: NextApiResponse) {
  // GET 请求不需要鉴权，直接使用公开处理函数
  if (req.method === 'GET') {
    return publicGetHandler(req, res);
  }

  // POST、PUT、DELETE 等请求需要鉴权
  return authMiddleware(handler)(req, res);
}
