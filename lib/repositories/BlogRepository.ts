import { BaseRepository } from './BaseRepository';

export interface BlogTagDTO {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export interface BlogDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  published: boolean;
  status: 'published' | 'draft';
  views: number;
  prevBlogId: string | null;
  nextBlogId: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: BlogTagDTO[];
}

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function mapRow(row: Record<string, unknown>, tags?: BlogTagDTO[]): BlogDTO {
  const published = row.published === true || row.published === 't';
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: String(row.excerpt || ''),
    content: String(row.content || ''),
    imageUrl: String(row.featured_image || row.image_url || ''),
    published,
    status: published ? 'published' : 'draft',
    views: Number(row.views ?? 0),
    prevBlogId: row.prev_blog_id ? String(row.prev_blog_id) : null,
    nextBlogId: row.next_blog_id ? String(row.next_blog_id) : null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
    tags: tags || (row.tags as BlogTagDTO[]) || [],
  };
}

export class BlogRepository extends BaseRepository {
  static async getAuthorName(): Promise<string> {
    const ds = await this.getDataSource();
    const rows = await ds.query('SELECT name FROM author_profile LIMIT 1');
    return rows[0]?.name || '五月的火';
  }

  static async getPublicBlogs(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginationResult<Omit<BlogDTO, 'content'>>> {
    const { page = 1, limit = 10, search } = options;
    const ds = await this.getDataSource();
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT
        b.id, b.title, b.slug, b.excerpt, b.featured_image,
        b.published, b.views, b.created_at, b.updated_at,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'color', t.color)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tags
      FROM blogs b
      LEFT JOIN blog_tags_legacy bt ON b.id = bt.blog_id
      LEFT JOIN tags_legacy t ON bt.tag_id = t.id
      WHERE b.published = true
    `;
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      queryText += ` AND (b.title ILIKE $${idx} OR b.excerpt ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    queryText += ` GROUP BY b.id ORDER BY b.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);

    const rows = await ds.query(queryText, params);

    let countQuery = 'SELECT COUNT(*) FROM blogs b WHERE b.published = true';
    const countParams: unknown[] = [];
    if (search) {
      countQuery += ' AND (b.title ILIKE $1 OR b.excerpt ILIKE $1)';
      countParams.push(`%${search}%`);
    }
    const countResult = await ds.query(countQuery, countParams);
    const total = parseInt(countResult[0].count as string);

    const data = rows.map((row: Record<string, unknown>) => {
      const blog = mapRow(row);
      const { content: _, ...rest } = blog;
      return rest;
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getAllBlogsAdmin(): Promise<BlogDTO[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(`
      SELECT
        b.id, b.title, b.slug, b.excerpt, b.content, b.featured_image,
        b.published, b.views, b.prev_blog_id, b.next_blog_id, b.created_at, b.updated_at,
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tag_names
      FROM blogs b
      LEFT JOIN blog_tags_legacy bt ON b.id = bt.blog_id
      LEFT JOIN tags_legacy t ON bt.tag_id = t.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);
    return rows.map((row: Record<string, unknown>) => ({
      ...mapRow(row),
      tags: [],
      tagNames: row.tag_names as string[],
    }));
  }

  static async getBlogBySlug(slug: string): Promise<BlogDTO | null> {
    const ds = await this.getDataSource();
    const rows = await ds.query(
      `SELECT id, title, slug, excerpt, content, featured_image, published,
              views, prev_blog_id, next_blog_id, created_at, updated_at
       FROM blogs WHERE slug = $1 AND published = true`,
      [slug]
    );
    if (!rows.length) return null;
    const tags = await this.getBlogTags(rows[0].id);
    return mapRow(rows[0], tags);
  }

  static async getBlogById(id: string): Promise<BlogDTO | null> {
    const ds = await this.getDataSource();
    const rows = await ds.query(
      `SELECT id, title, slug, excerpt, content, featured_image, published,
              views, prev_blog_id, next_blog_id, created_at, updated_at
       FROM blogs WHERE id = $1`,
      [id]
    );
    if (!rows.length) return null;
    const tags = await this.getBlogTags(id);
    return mapRow(rows[0], tags);
  }

  static async getBlogTags(blogId: string): Promise<BlogTagDTO[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(
      `SELECT t.id, t.name, t.slug, t.color
       FROM tags_legacy t
       INNER JOIN blog_tags_legacy bt ON t.id = bt.tag_id
       WHERE bt.blog_id = $1
       ORDER BY t.name`,
      [blogId]
    );
    return rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      color: r.color as string | undefined,
    }));
  }

  static async getRelatedBlogs(blogId: string, limit = 5): Promise<Pick<BlogDTO, 'id' | 'title' | 'slug'>[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(
      `SELECT b.id, b.title, b.slug
       FROM blogs b
       INNER JOIN blog_tags_legacy bt ON b.id = bt.blog_id
       WHERE bt.tag_id IN (
         SELECT tag_id FROM blog_tags_legacy WHERE blog_id = $1::uuid
       )
       AND b.id != $1::uuid
       AND b.published = true
       GROUP BY b.id, b.title, b.slug, b.created_at
       ORDER BY b.created_at DESC
       LIMIT $2`,
      [blogId, limit]
    );
    return rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      title: String(r.title),
      slug: String(r.slug),
    }));
  }

  static async createBlog(data: {
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    imageUrl?: string;
    published?: boolean;
    tagNames?: string[];
  }): Promise<BlogDTO> {
    const ds = await this.getDataSource();
    const existing = await ds.query('SELECT id FROM blogs WHERE slug = $1', [data.slug]);
    if (existing.length) throw new Error('Slug已存在');

    const rows = await ds.query(
      `INSERT INTO blogs (title, slug, excerpt, content, featured_image, published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        data.title,
        data.slug,
        data.excerpt || '',
        data.content || '',
        data.imageUrl || '',
        data.published ?? true,
      ]
    );
    const blog = mapRow(rows[0]);
    if (data.tagNames?.length) {
      await this.linkTagsByNames(blog.id, data.tagNames);
    }
    return (await this.getBlogById(blog.id))!;
  }

  static async updateBlog(id: string, data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    imageUrl?: string;
    published?: boolean;
    status?: 'published' | 'draft' | 'archived';
    prevBlogId?: string | null;
    nextBlogId?: string | null;
  }): Promise<BlogDTO> {
    const ds = await this.getDataSource();
    const blog = await this.getBlogById(id);
    if (!blog) throw new Error('文章不存在');

    let published = blog.published;
    if (data.status !== undefined) {
      published = data.status === 'published';
    } else if (data.published !== undefined) {
      published = data.published;
    }

    const oldPrevId = blog.prevBlogId;
    const oldNextId = blog.nextBlogId;

    await ds.query(
      `UPDATE blogs SET
        title = COALESCE($2, title),
        slug = COALESCE($3, slug),
        excerpt = COALESCE($4, excerpt),
        content = COALESCE($5, content),
        featured_image = COALESCE($6, featured_image),
        published = $7,
        updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        data.title,
        data.slug,
        data.excerpt,
        data.content,
        data.imageUrl,
        published,
      ]
    );

    if (data.prevBlogId !== undefined) {
      await ds.query(
        `UPDATE blogs SET prev_blog_id = $2::uuid, updated_at = NOW() WHERE id = $1::uuid`,
        [id, data.prevBlogId]
      );
    }
    if (data.nextBlogId !== undefined) {
      await ds.query(
        `UPDATE blogs SET next_blog_id = $2::uuid, updated_at = NOW() WHERE id = $1::uuid`,
        [id, data.nextBlogId]
      );
    }

    if (data.prevBlogId !== undefined || data.nextBlogId !== undefined) {
      if (data.prevBlogId !== undefined) {
        if (oldPrevId && oldPrevId !== data.prevBlogId) {
          await ds.query(
            `UPDATE blogs SET next_blog_id = NULL
             WHERE id = $1::uuid AND next_blog_id = $2::uuid`,
            [oldPrevId, id]
          );
        }
        if (data.prevBlogId) {
          await ds.query(
            `UPDATE blogs SET next_blog_id = $2::uuid WHERE id = $1::uuid`,
            [data.prevBlogId, id]
          );
        }
      }

      if (data.nextBlogId !== undefined) {
        if (oldNextId && oldNextId !== data.nextBlogId) {
          await ds.query(
            `UPDATE blogs SET prev_blog_id = NULL
             WHERE id = $1::uuid AND prev_blog_id = $2::uuid`,
            [oldNextId, id]
          );
        }
        if (data.nextBlogId) {
          await ds.query(
            `UPDATE blogs SET prev_blog_id = $2::uuid WHERE id = $1::uuid`,
            [data.nextBlogId, id]
          );
        }
      }
    }

    return (await this.getBlogById(id))!;
  }

  static async incrementViews(id: string): Promise<number> {
    const ds = await this.getDataSource();
    const rows = await ds.query(
      `UPDATE blogs SET views = views + 1 WHERE id = $1::uuid RETURNING views`,
      [id]
    );
    if (!rows.length) throw new Error('文章不存在');
    return Number(rows[0].views);
  }

  static async getAdjacentBlogs(id: string): Promise<{
    prevBlog: Pick<BlogDTO, 'id' | 'title' | 'slug'> | null;
    nextBlog: Pick<BlogDTO, 'id' | 'title' | 'slug'> | null;
  }> {
    const blog = await this.getBlogById(id);
    if (!blog) return { prevBlog: null, nextBlog: null };

    const ds = await this.getDataSource();
    let prevBlog: Pick<BlogDTO, 'id' | 'title' | 'slug'> | null = null;
    let nextBlog: Pick<BlogDTO, 'id' | 'title' | 'slug'> | null = null;

    if (blog.prevBlogId) {
      const rows = await ds.query(
        `SELECT id, title, slug FROM blogs WHERE id = $1::uuid AND published = true`,
        [blog.prevBlogId]
      );
      if (rows.length) {
        prevBlog = { id: String(rows[0].id), title: rows[0].title, slug: rows[0].slug };
      }
    }

    if (blog.nextBlogId) {
      const rows = await ds.query(
        `SELECT id, title, slug FROM blogs WHERE id = $1::uuid AND published = true`,
        [blog.nextBlogId]
      );
      if (rows.length) {
        nextBlog = { id: String(rows[0].id), title: rows[0].title, slug: rows[0].slug };
      }
    }

    return { prevBlog, nextBlog };
  }

  static async deleteBlog(id: string): Promise<boolean> {
    const ds = await this.getDataSource();
    const result = await ds.query('DELETE FROM blogs WHERE id = $1', [id]);
    return (result as unknown as { rowCount?: number }).rowCount > 0 || true;
  }

  private static async linkTagsByNames(blogId: string, tagNames: string[]): Promise<void> {
    const ds = await this.getDataSource();
    for (const name of tagNames) {
      const slug = name.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
      let tag = await ds.query(
        'SELECT id FROM tags_legacy WHERE slug = $1 OR name = $2 LIMIT 1',
        [slug, name]
      );
      if (!tag.length) {
        tag = await ds.query(
          'INSERT INTO tags_legacy (name, slug, color) VALUES ($1, $2, $3) RETURNING id',
          [name, slug, '#6C757D']
        );
      }
      await ds.query(
        'INSERT INTO blog_tags_legacy (blog_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [blogId, tag[0].id]
      );
    }
  }
}
