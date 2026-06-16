import { query } from '../../../lib/db';
import TagPageContent from './TagPageContent';

interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  slug: string;
  image: string;
  tags: string[];
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const result = await query(
      `SELECT t.name FROM tags t WHERE t.slug = $1`,
      [(await params).slug]
    );
    if (result.rows.length > 0) {
      return {
        title: `${result.rows[0].name} - 五月的火`,
        description: `浏览标签为 ${result.rows[0].name} 的所有文章`,
      };
    }
  } catch {}
  return { title: '标签未找到 - 五月的火' };
}

export default async function TagSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const page = parseInt((await searchParams).page || '1') || 1;
  const postsPerPage = 4;
  const offset = (page - 1) * postsPerPage;

  let tag: Tag | null = null;
  let posts: Post[] = [];
  let totalPages = 0;

  try {
    const tagExists = await query(
      `SELECT EXISTS (SELECT 1 FROM tags t WHERE t.slug = $1)`,
      [slug]
    );

    if (!tagExists.rows[0].exists) {
      return <TagPageContent tag={null as any} posts={[]} currentPage={1} totalPages={0} />;
    }

    const tagResult = await query(
      `SELECT
        t.id, t.name, t.slug,
        COUNT(pt.post_id) as post_count
       FROM tags t
       LEFT JOIN post_tags pt ON t.id = pt.tag_id
       LEFT JOIN posts p ON pt.post_id = p.id
       WHERE t.slug = $1 and p.status = 'published'
       GROUP BY t.id`,
      [slug]
    );

    if (tagResult.rows.length === 0) {
      return <TagPageContent tag={null as any} posts={[]} currentPage={1} totalPages={0} />;
    }

    tag = tagResult.rows[0];

    const postsResult = await query(
      `SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(t2.name) FILTER (WHERE t2.name IS NOT NULL), '[]'
        ) as tags
       FROM posts p
       INNER JOIN post_tags pt ON p.id = pt.post_id
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN post_tags pt2 ON p.id = pt2.post_id
       LEFT JOIN tags t2 ON pt2.tag_id = t2.id
       WHERE pt.tag_id = $1 AND p.status = 'published'
       GROUP BY p.id, u.username
       ORDER BY p.published_at DESC
       LIMIT $2 OFFSET $3`,
      [tag.id, postsPerPage, offset]
    );

    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM posts p
       INNER JOIN post_tags pt ON p.id = pt.post_id
       WHERE pt.tag_id = $1 AND p.status = 'published'`,
      [tag.id]
    );

    const totalPosts = parseInt(countResult.rows[0].count);
    totalPages = Math.ceil(totalPosts / postsPerPage);

    posts = postsResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      date: new Date(row.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      author: row.author_name,
      excerpt: row.excerpt,
      slug: row.slug,
      image: row.image_url || '',
      tags: row.tags,
    }));
  } catch (error) {
    console.error('Error fetching tag page:', error);
  }

  if (!tag) {
    return <TagPageContent tag={null as any} posts={[]} currentPage={1} totalPages={0} />;
  }

  return (
    <TagPageContent
      tag={tag}
      posts={posts}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}
