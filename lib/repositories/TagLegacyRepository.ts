import { BaseRepository } from './BaseRepository';

export interface TagLegacyDTO {
  id: string;
  name: string;
  slug: string;
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
  postCount: number;
}

function mapTagRow(row: Record<string, unknown>): TagLegacyDTO {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    color: String(row.color || '#6C757D'),
    createdAt: row.created_at as Date | undefined,
    updatedAt: row.updated_at as Date | undefined,
    postCount: parseInt(String(row.post_count ?? row.cnt ?? 0), 10),
  };
}

export class TagLegacyRepository extends BaseRepository {
  static async getAllTagsWithCount(): Promise<TagLegacyDTO[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(`
      SELECT t.id, t.name, t.slug, t.color, t.created_at, t.updated_at,
             COUNT(bt.blog_id) FILTER (WHERE b.published = true) as post_count
      FROM tags_legacy t
      LEFT JOIN blog_tags_legacy bt ON t.id = bt.tag_id
      LEFT JOIN blogs b ON bt.blog_id = b.id
      GROUP BY t.id
      ORDER BY t.name ASC
    `);
    return rows.map((r: Record<string, unknown>) => mapTagRow(r));
  }

  static async getPopularTags(limit = 10): Promise<TagLegacyDTO[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(`
      SELECT t.id, t.name, t.slug, t.color,
             COUNT(DISTINCT b.id) as post_count
      FROM tags_legacy t
      INNER JOIN blog_tags_legacy bt ON t.id = bt.tag_id
      INNER JOIN blogs b ON bt.blog_id = b.id AND b.published = true
      GROUP BY t.id
      ORDER BY post_count DESC
      LIMIT $1
    `, [limit]);
    return rows.map((r: Record<string, unknown>) => mapTagRow(r));
  }

  static async getTagBySlug(slug: string): Promise<TagLegacyDTO | null> {
    const ds = await this.getDataSource();
    const rows = await ds.query(`
      SELECT t.id, t.name, t.slug, t.color, t.created_at, t.updated_at,
             COUNT(bt.blog_id) FILTER (WHERE b.published = true) as post_count
      FROM tags_legacy t
      LEFT JOIN blog_tags_legacy bt ON t.id = bt.tag_id
      LEFT JOIN blogs b ON bt.blog_id = b.id
      WHERE t.slug = $1
      GROUP BY t.id
    `, [slug]);
    if (!rows.length) return null;
    return mapTagRow(rows[0]);
  }

  static async getTagById(id: string): Promise<TagLegacyDTO | null> {
    const ds = await this.getDataSource();
    const rows = await ds.query(`
      SELECT t.id, t.name, t.slug, t.color, t.created_at, t.updated_at,
             COUNT(bt.blog_id) as post_count
      FROM tags_legacy t
      LEFT JOIN blog_tags_legacy bt ON t.id = bt.tag_id
      WHERE t.id = $1::uuid
      GROUP BY t.id
    `, [id]);
    if (!rows.length) return null;
    return mapTagRow(rows[0]);
  }

  static async getBlogsByTagSlug(
    slug: string,
    page = 1,
    limit = 6
  ): Promise<{
    tag: TagLegacyDTO;
    blogs: Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string;
      imageUrl: string;
      updatedAt: Date;
      tags: Array<{ name: string; color: string; slug: string }>;
    }>;
    total: number;
    totalPages: number;
  } | null> {
    const tag = await this.getTagBySlug(slug);
    if (!tag) return null;

    const ds = await this.getDataSource();
    const offset = (page - 1) * limit;

    const rows = await ds.query(`
      SELECT b.id, b.title, b.slug, b.excerpt, b.featured_image, b.updated_at,
             COALESCE(
               json_agg(
                 json_build_object('name', t2.name, 'slug', t2.slug, 'color', t2.color)
               ) FILTER (WHERE t2.id IS NOT NULL), '[]'
             ) as tags
      FROM blogs b
      INNER JOIN blog_tags_legacy bt ON b.id = bt.blog_id
      INNER JOIN tags_legacy t ON bt.tag_id = t.id AND t.slug = $1
      LEFT JOIN blog_tags_legacy bt2 ON b.id = bt2.blog_id
      LEFT JOIN tags_legacy t2 ON bt2.tag_id = t2.id
      WHERE b.published = true
      GROUP BY b.id
      ORDER BY b.updated_at DESC
      LIMIT $2 OFFSET $3
    `, [slug, limit, offset]);

    const countResult = await ds.query(`
      SELECT COUNT(DISTINCT b.id) as count
      FROM blogs b
      INNER JOIN blog_tags_legacy bt ON b.id = bt.blog_id
      INNER JOIN tags_legacy t ON bt.tag_id = t.id AND t.slug = $1
      WHERE b.published = true
    `, [slug]);

    const total = parseInt(countResult[0].count as string, 10);

    return {
      tag,
      blogs: rows.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        title: String(r.title),
        slug: String(r.slug),
        excerpt: String(r.excerpt || ''),
        imageUrl: String(r.featured_image || ''),
        updatedAt: r.updated_at as Date,
        tags: (r.tags as Array<{ name: string; slug: string; color: string }>) || [],
      })),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async createTag(data: {
    name: string;
    slug: string;
    color?: string;
  }): Promise<TagLegacyDTO> {
    const ds = await this.getDataSource();
    const existing = await ds.query(
      'SELECT id FROM tags_legacy WHERE slug = $1',
      [data.slug]
    );
    if (existing.length) throw new Error('Slug已存在');

    const rows = await ds.query(
      `INSERT INTO tags_legacy (name, slug, color, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [data.name, data.slug, data.color || '#FF6B6B']
    );
    return { ...mapTagRow(rows[0]), postCount: 0 };
  }

  static async updateTag(
    id: string,
    data: { name: string; slug: string; color?: string }
  ): Promise<TagLegacyDTO> {
    const ds = await this.getDataSource();
    const dup = await ds.query(
      'SELECT id FROM tags_legacy WHERE slug = $1 AND id != $2::uuid',
      [data.slug, id]
    );
    if (dup.length) throw new Error('Slug已被其他标签使用');

    const rows = await ds.query(
      `UPDATE tags_legacy SET name = $2, slug = $3, color = $4, updated_at = NOW()
       WHERE id = $1::uuid RETURNING *`,
      [id, data.name, data.slug, data.color || '#FF6B6B']
    );
    if (!rows.length) throw new Error('标签不存在');
    const tag = await this.getTagById(id);
    return tag!;
  }

  static async deleteTag(id: string): Promise<void> {
    const ds = await this.getDataSource();
    await ds.query('DELETE FROM blog_tags_legacy WHERE tag_id = $1::uuid', [id]);
    const result = await ds.query(
      'DELETE FROM tags_legacy WHERE id = $1::uuid RETURNING id',
      [id]
    );
    if (!result.length) throw new Error('标签不存在');
  }
}
