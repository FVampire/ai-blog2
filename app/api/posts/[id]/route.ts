import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, isAuthError } from '@/lib/auth-middleware-app';
import { query, getClient } from '@/lib/db';
import { generateEmbedding } from '@/lib/embedding';
import { VectorRepository } from '@/lib/repositories/VectorRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const result = await query(
      `SELECT
        p.id, p.title, p.slug, p.excerpt, p.content, p.image_url,
        p.status, p.views, p.created_at, p.updated_at, p.published_at,
        p.prev_post_id, p.next_post_id,
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
      WHERE p.id = $1
      GROUP BY p.id, u.username, u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '文章不存在' },
        { status: 404 }
      );
    }

    const post = result.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          imageUrl: post.image_url,
          status: post.status,
          views: post.views,
          author: { id: post.author_id, name: post.author_name },
          tags: post.tags,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          publishedAt: post.published_at,
          prev_post_id: post.prev_post_id,
          next_post_id: post.next_post_id,
        },
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, slug, excerpt, content, imageUrl, status, tagIds, prevPostId, nextPostId } = body;

    const client = await getClient();

    try {
      await client.query('BEGIN');

      const oldPostResult = await client.query(
        'SELECT prev_post_id, next_post_id FROM posts WHERE id = $1',
        [id]
      );

      const oldPost = oldPostResult.rows[0];
      const oldPrevId = oldPost?.prev_post_id;
      const oldNextId = oldPost?.next_post_id;

      const updateFields: string[] = [];
      const updateValues: unknown[] = [];
      let paramIndex = 1;

      if (title !== undefined) { updateFields.push(`title = $${paramIndex}`); updateValues.push(title); paramIndex++; }
      if (slug !== undefined) { updateFields.push(`slug = $${paramIndex}`); updateValues.push(slug); paramIndex++; }
      if (excerpt !== undefined) { updateFields.push(`excerpt = $${paramIndex}`); updateValues.push(excerpt); paramIndex++; }
      if (content !== undefined) { updateFields.push(`content = $${paramIndex}`); updateValues.push(content); paramIndex++; }
      if (imageUrl !== undefined) { updateFields.push(`image_url = $${paramIndex}`); updateValues.push(imageUrl); paramIndex++; }
      if (status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(status);
        paramIndex++;
        if (status === 'published') {
          updateFields.push(`published_at = COALESCE(published_at, CURRENT_TIMESTAMP)`);
        }
      }
      if (prevPostId !== undefined) { updateFields.push(`prev_post_id = $${paramIndex}`); updateValues.push(prevPostId); paramIndex++; }
      if (nextPostId !== undefined) { updateFields.push(`next_post_id = $${paramIndex}`); updateValues.push(nextPostId); paramIndex++; }

      if (updateFields.length === 0 && (!tagIds || !Array.isArray(tagIds))) {
        return NextResponse.json(
          { success: false, message: '没有需要更新的字段' },
          { status: 400 }
        );
      }

      let updateResult;

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        const updateQuery = `UPDATE posts SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        updateResult = await client.query(updateQuery, updateValues);

        if (updateResult.rows.length === 0) {
          throw new Error('文章不存在');
        }
      } else {
        const checkResult = await client.query('SELECT * FROM posts WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
          throw new Error('文章不存在');
        }
        updateResult = checkResult;
      }

      if (tagIds !== undefined && Array.isArray(tagIds)) {
        await client.query('DELETE FROM post_tags WHERE post_id = $1', [id]);
        if (tagIds.length > 0) {
          const tagValues = tagIds.map((_: any, index: number) => `($1, $${index + 2})`).join(',');
          const tagParams = [id, ...tagIds];
          await client.query(
            `INSERT INTO post_tags (post_id, tag_id) VALUES ${tagValues}`,
            tagParams
          );
        }
      }

      if (prevPostId !== undefined || nextPostId !== undefined) {
        if (prevPostId !== undefined) {
          if (oldPrevId && oldPrevId !== prevPostId) {
            await client.query(
              `UPDATE posts SET next_post_id = NULL WHERE id = $1 AND next_post_id = $2`,
              [oldPrevId, id]
            );
          }
          if (prevPostId) {
            await client.query(
              `UPDATE posts SET next_post_id = $1 WHERE id = $2`,
              [id, prevPostId]
            );
          }
        }

        if (nextPostId !== undefined) {
          if (oldNextId && oldNextId !== nextPostId) {
            await client.query(
              `UPDATE posts SET prev_post_id = NULL WHERE id = $1 AND prev_post_id = $2`,
              [oldNextId, id]
            );
          }
          if (nextPostId) {
            await client.query(
              `UPDATE posts SET prev_post_id = $1 WHERE id = $2`,
              [id, nextPostId]
            );
          }
        }
      }

      await client.query('COMMIT');

      setTimeout(async () => {
        try {
          const postResult = await query(
            'SELECT title, content, excerpt, status FROM posts WHERE id = $1',
            [id]
          );
          if (postResult.rows.length > 0) {
            const post = postResult.rows[0];
            if (post.status === 'published') {
              const vectors = await generateEmbedding(post.title, post.content || '', post.excerpt || '');
              if (vectors) {
                await VectorRepository.saveVectors(parseInt(id), vectors);
              }
            } else {
              const hasVectors = await VectorRepository.hasVectors(parseInt(id));
              if (hasVectors) {
                await VectorRepository.deleteVectors(parseInt(id));
              }
            }
          }
        } catch (vectorError) {
          console.error(`[Vector] Failed to update embedding for post ${id}:`, vectorError);
        }
      }, 0);

      return NextResponse.json({
        success: true,
        message: '文章更新成功',
        data: { post: updateResult.rows[0] },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const result = await query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '文章不存在' },
        { status: 404 }
      );
    }

    setTimeout(async () => {
      try {
        await VectorRepository.deleteVectors(parseInt(id));
      } catch (vectorError) {
        console.error(`[Vector] Failed to delete embedding for post ${id}:`, vectorError);
      }
    }, 0);

    return NextResponse.json({
      success: true,
      message: '文章删除成功',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
