import { query } from '../../../lib/db';
import AdminPostsContent from './AdminPostsContent';

export const metadata = {
  title: '文章管理 - Blog Admin',
};

export default async function AdminPostsPage() {
  let posts: any[] = [];

  try {
    const result = await query(
      `SELECT p.id, p.title, p.slug, p.status, p.views, p.published_at, p.created_at,
        u.username as author_name,
        COALESCE(json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]') as tags
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN post_tags pt ON p.id = pt.post_id
       LEFT JOIN tags t ON pt.tag_id = t.id
       GROUP BY p.id, u.username
       ORDER BY p.created_at DESC`
    );

    posts = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      author: row.author_name || 'Unknown',
      date: row.published_at
        ? new Date(row.published_at as string).toLocaleDateString('zh-CN')
        : new Date(row.created_at as string).toLocaleDateString('zh-CN'),
      status: row.status,
      views: row.views || 0,
      tags: Array.isArray(row.tags) ? row.tags : JSON.parse((row.tags as string) || '[]'),
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
  }

  return <AdminPostsContent posts={posts} totalPosts={posts.length} />;
}
