import { NextApiResponse } from 'next';
import { authMiddleware, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { query, getClient } from '../../../lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: '无效的文章ID',
    });
  }

  try {
    if (req.method === 'GET') {
      // Get single post
      const result = await query(
        `
        SELECT
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
        GROUP BY p.id, u.username, u.id
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '文章不存在',
        });
      }

      const post = result.rows[0];

      return res.status(200).json({
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
            author: {
              id: post.author_id,
              name: post.author_name,
            },
            tags: post.tags,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            publishedAt: post.published_at,
            prev_post_id: post.prev_post_id,
            next_post_id: post.next_post_id,
          },
        },
      });
    } else if (req.method === 'PUT') {
      // Update post
      const { title, slug, excerpt, content, imageUrl, status, tagIds, prevPostId, nextPostId } = req.body;

      console.log('📝 [PUT /api/posts/:id] Received data:', {
        id,
        prevPostId,
        nextPostId,
        hasTitle: !!title,
        hasContent: !!content,
      });

      const client = await getClient();

      try {
        await client.query('BEGIN');

        // 查询当前文章的旧关联关系
        const oldPostResult = await client.query(
          'SELECT prev_post_id, next_post_id FROM posts WHERE id = $1',
          [id]
        );

        const oldPost = oldPostResult.rows[0];
        const oldPrevId = oldPost?.prev_post_id;
        const oldNextId = oldPost?.next_post_id;

        // 构建动态更新 SQL
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        // 只更新传入的字段（区分 undefined 和空值）
        if (title !== undefined) {
          updateFields.push(`title = $${paramIndex}`);
          updateValues.push(title);
          paramIndex++;
        }

        if (slug !== undefined) {
          updateFields.push(`slug = $${paramIndex}`);
          updateValues.push(slug);
          paramIndex++;
        }

        if (excerpt !== undefined) {
          updateFields.push(`excerpt = $${paramIndex}`);
          updateValues.push(excerpt);
          paramIndex++;
        }

        if (content !== undefined) {
          updateFields.push(`content = $${paramIndex}`);
          updateValues.push(content);
          paramIndex++;
        }

        if (imageUrl !== undefined) {
          updateFields.push(`image_url = $${paramIndex}`);
          updateValues.push(imageUrl);
          paramIndex++;
        }

        if (status !== undefined) {
          updateFields.push(`status = $${paramIndex}`);
          updateValues.push(status);
          paramIndex++;

          // 如果状态改为 published 且之前没有发布时间，设置发布时间
          if (status === 'published') {
            updateFields.push(`published_at = COALESCE(published_at, CURRENT_TIMESTAMP)`);
          }
        }

        if (prevPostId !== undefined) {
          updateFields.push(`prev_post_id = $${paramIndex}`);
          updateValues.push(prevPostId);
          paramIndex++;
        }

        if (nextPostId !== undefined) {
          updateFields.push(`next_post_id = $${paramIndex}`);
          updateValues.push(nextPostId);
          paramIndex++;
        }

        // 如果没有任何字段需要更新，但有标签更新
        if (updateFields.length === 0 && (!tagIds || !Array.isArray(tagIds))) {
          return res.status(400).json({
            success: false,
            message: '没有需要更新的字段',
          });
        }

        let updateResult;

        // 如果有字段需要更新
        if (updateFields.length > 0) {
          updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
          updateValues.push(id); // 最后一个参数是 ID

          const updateQuery = `
            UPDATE posts
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;

          console.log('🔄 [PUT /api/posts/:id] Executing SQL:', {
            query: updateQuery,
            values: updateValues,
            fieldsCount: updateFields.length,
          });

          updateResult = await client.query(updateQuery, updateValues);

          if (updateResult.rows.length === 0) {
            throw new Error('文章不存在');
          }
        } else {
          // 只更新标签的情况，先查询文章是否存在
          const checkResult = await client.query('SELECT * FROM posts WHERE id = $1', [id]);
          if (checkResult.rows.length === 0) {
            throw new Error('文章不存在');
          }
          updateResult = checkResult;
        }

        // Update tags
        if (tagIds !== undefined && Array.isArray(tagIds)) {
          // Delete existing tags
          await client.query('DELETE FROM post_tags WHERE post_id = $1', [id]);

          // Insert new tags
          if (tagIds.length > 0) {
            const tagValues = tagIds.map((tagId, index) => `($1, $${index + 2})`).join(',');
            const tagParams = [id, ...tagIds];
            await client.query(
              `INSERT INTO post_tags (post_id, tag_id) VALUES ${tagValues}`,
              tagParams
            );
          }
        }

        // 同步更新前后文章的关联关系（双向绑定）
        if (prevPostId !== undefined || nextPostId !== undefined) {
          console.log('🔗 [PUT /api/posts/:id] Syncing bidirectional relations:', {
            currentPostId: id,
            oldPrevId,
            oldNextId,
            newPrevId: prevPostId,
            newNextId: nextPostId,
          });

          // 处理上一篇文章的关系
          if (prevPostId !== undefined) {
            // 如果有旧的上一篇，清除旧上一篇的 next_post_id（如果指向当前文章）
            if (oldPrevId && oldPrevId !== prevPostId) {
              await client.query(
                `UPDATE posts
                 SET next_post_id = NULL
                 WHERE id = $1 AND next_post_id = $2`,
                [oldPrevId, id]
              );
              console.log(`  ✓ Cleared old prev post (${oldPrevId}) next_post_id`);
            }

            // 如果设置了新的上一篇，更新新上一篇的 next_post_id 为当前文章
            if (prevPostId) {
              await client.query(
                `UPDATE posts
                 SET next_post_id = $1
                 WHERE id = $2`,
                [id, prevPostId]
              );
              console.log(`  ✓ Set new prev post (${prevPostId}) next_post_id to ${id}`);
            }
          }

          // 处理下一篇文章的关系
          if (nextPostId !== undefined) {
            // 如果有旧的下一篇，清除旧下一篇的 prev_post_id（如果指向当前文章）
            if (oldNextId && oldNextId !== nextPostId) {
              await client.query(
                `UPDATE posts
                 SET prev_post_id = NULL
                 WHERE id = $1 AND prev_post_id = $2`,
                [oldNextId, id]
              );
              console.log(`  ✓ Cleared old next post (${oldNextId}) prev_post_id`);
            }

            // 如果设置了新的下一篇，更新新下一篇的 prev_post_id 为当前文章
            if (nextPostId) {
              await client.query(
                `UPDATE posts
                 SET prev_post_id = $1
                 WHERE id = $2`,
                [id, nextPostId]
              );
              console.log(`  ✓ Set new next post (${nextPostId}) prev_post_id to ${id}`);
            }
          }
        }

        await client.query('COMMIT');

        return res.status(200).json({
          success: true,
          message: '文章更新成功',
          data: {
            post: updateResult.rows[0],
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else if (req.method === 'DELETE') {
      // Delete post
      const result = await query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '文章不存在',
        });
      }

      return res.status(200).json({
        success: true,
        message: '文章删除成功',
      });
    } else {
      return res.status(405).json({
        success: false,
        message: '方法不允许',
      });
    }
  } catch (error) {
    console.error('Post operation error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

export default authMiddleware(handler);
