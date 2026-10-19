import { generateSlug } from '../agent-utils';
import { query } from '../db';
import { exposeMediaUrl, storeMediaUrl } from '../media-url';
import { BaseRepository } from './BaseRepository';

export interface SeriesPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date | null;
}

export interface SeriesRecord {
  id: number;
  slug: string;
  title: string;
  description: string;
  coverUrl: string;
  createdAt: Date;
  updatedAt: Date;
  posts: SeriesPost[];
  publishedCount: number;
  totalCount: number;
}

function mapSeriesRow(row: Record<string, unknown>, posts: SeriesPost[] = []): SeriesRecord {
  const published = posts.filter((post) => post.status === 'published');
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description || ''),
    coverUrl: exposeMediaUrl(String(row.cover_url || '')),
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
    posts,
    publishedCount: published.length,
    totalCount: posts.length,
  };
}

async function uniqueSeriesSlug(base: string): Promise<string> {
  const slug = generateSlug(base) || `series-${Date.now()}`;
  const existing = await query('SELECT slug FROM post_series WHERE slug = $1 OR slug LIKE $2', [slug, `${slug}-%`]);
  const taken = new Set(existing.rows.map((row: { slug: string }) => row.slug));
  if (!taken.has(slug)) return slug;
  let index = 2;
  while (taken.has(`${slug}-${index}`)) index += 1;
  return `${slug}-${index}`;
}

export class SeriesRepository extends BaseRepository {
  static async getById(id: number): Promise<SeriesRecord | null> {
    const rows = await query('SELECT * FROM post_series WHERE id = $1', [id]);
    if (!rows.rows[0]) return null;
    const posts = await this.getPosts(id);
    return mapSeriesRow(rows.rows[0], posts);
  }

  static async getBySlug(slug: string): Promise<SeriesRecord | null> {
    const rows = await query('SELECT * FROM post_series WHERE slug = $1', [slug]);
    if (!rows.rows[0]) return null;
    const posts = await this.getPosts(Number(rows.rows[0].id));
    return mapSeriesRow(rows.rows[0], posts);
  }

  static async getByPostId(postId: number): Promise<SeriesRecord | null> {
    const rows = await query(
      `SELECT s.*
       FROM post_series s
       JOIN posts p ON p.series_id = s.id
       WHERE p.id = $1`,
      [postId],
    );
    if (!rows.rows[0]) return null;
    const posts = await this.getPosts(Number(rows.rows[0].id));
    return mapSeriesRow(rows.rows[0], posts);
  }

  static async listPublic(): Promise<SeriesRecord[]> {
    const rows = await query(
      `SELECT s.*
       FROM post_series s
       WHERE EXISTS (
         SELECT 1 FROM posts p WHERE p.series_id = s.id AND p.status = 'published'
       )
       ORDER BY s.updated_at DESC`,
    );
    const series: SeriesRecord[] = [];
    for (const row of rows.rows) {
      const posts = await this.getPosts(Number(row.id));
      const record = mapSeriesRow(row, posts);
      if (record.publishedCount > 0) series.push(record);
    }
    return series;
  }

  static async listAll(): Promise<SeriesRecord[]> {
    const rows = await query('SELECT * FROM post_series ORDER BY updated_at DESC');
    const series: SeriesRecord[] = [];
    for (const row of rows.rows) {
      series.push(mapSeriesRow(row, await this.getPosts(Number(row.id))));
    }
    return series;
  }

  static async getPosts(seriesId: number): Promise<SeriesPost[]> {
    const rows = await query(
      `SELECT id, title, slug, excerpt, image_url, status, published_at, prev_post_id, next_post_id
       FROM posts
       WHERE series_id = $1`,
      [seriesId],
    );
    const byId = new Map(rows.rows.map((row: Record<string, unknown>) => [Number(row.id), row]));
    const heads = rows.rows.filter((row: Record<string, unknown>) => {
      const prev = row.prev_post_id == null ? null : Number(row.prev_post_id);
      return prev == null || !byId.has(prev);
    });

    const ordered: SeriesPost[] = [];
    const visited = new Set<number>();
    const walk = (start: Record<string, unknown>) => {
      let current: Record<string, unknown> | undefined = start;
      while (current && !visited.has(Number(current.id))) {
        visited.add(Number(current.id));
        ordered.push({
          id: Number(current.id),
          title: String(current.title),
          slug: String(current.slug),
          excerpt: String(current.excerpt || ''),
          imageUrl: exposeMediaUrl(String(current.image_url || '')),
          status: current.status as SeriesPost['status'],
          publishedAt: (current.published_at as Date | null) || null,
        });
        const nextId: number | null = current.next_post_id == null ? null : Number(current.next_post_id);
        current = nextId ? byId.get(nextId) : undefined;
      }
    };

    heads.forEach((row) => walk(row));
    rows.rows.filter((row: Record<string, unknown>) => !visited.has(Number(row.id))).forEach((row) => walk(row));
    return ordered;
  }

  static async create(data: {
    title: string;
    slug?: string;
    description?: string;
    coverUrl?: string;
  }): Promise<SeriesRecord> {
    const slug = data.slug?.trim() || await uniqueSeriesSlug(data.title);
    const result = await query(
      `INSERT INTO post_series (slug, title, description, cover_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [slug, data.title.trim(), data.description || '', storeMediaUrl(data.coverUrl)],
    );
    return mapSeriesRow(result.rows[0], []);
  }

  static async update(id: number, data: {
    title?: string;
    slug?: string;
    description?: string;
    coverUrl?: string;
  }): Promise<SeriesRecord | null> {
    const current = await this.getById(id);
    if (!current) return null;
    const slug = data.slug?.trim() ? generateSlug(data.slug) : current.slug;
    await query(
      `UPDATE post_series
       SET slug = $1, title = $2, description = $3, cover_url = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        slug,
        data.title?.trim() || current.title,
        data.description === undefined ? current.description : data.description,
        data.coverUrl === undefined ? storeMediaUrl(current.coverUrl) : storeMediaUrl(data.coverUrl),
        id,
      ],
    );
    return this.getById(id);
  }

  static async saveChain(postIds: number[], meta: {
    seriesId?: number | null;
    title?: string;
    slug?: string;
    description?: string;
    coverUrl?: string;
    previousPostIds?: number[];
  } = {}): Promise<SeriesRecord> {
    if (postIds.length < 2) throw new Error('一个系列至少需要两篇文章');

    const first = await query('SELECT id, title, excerpt, image_url FROM posts WHERE id = $1', [postIds[0]]);
    if (!first.rows[0]) throw new Error('文章不存在');

    let seriesId = meta.seriesId || null;
    if (!seriesId) {
      const existing = await query(
        'SELECT series_id FROM posts WHERE id = ANY($1::int[]) AND series_id IS NOT NULL LIMIT 1',
        [postIds],
      );
      seriesId = existing.rows[0]?.series_id ? Number(existing.rows[0].series_id) : null;
    }
    if (seriesId) {
      await this.update(seriesId, {
        title: meta.title,
        slug: meta.slug,
        description: meta.description,
        coverUrl: meta.coverUrl,
      });
    } else {
      const created = await this.create({
        title: meta.title || String(first.rows[0].title),
        slug: meta.slug,
        description: meta.description || String(first.rows[0].excerpt || ''),
        coverUrl: meta.coverUrl || String(first.rows[0].image_url || ''),
      });
      seriesId = created.id;
    }

    const previous = meta.previousPostIds || [];
    const removed = previous.filter((id) => !postIds.includes(id));
    if (removed.length > 0) {
      await query(
        `UPDATE posts SET series_id = NULL
         WHERE id = ANY($1::int[]) AND series_id = $2`,
        [removed, seriesId],
      );
    }

    await query('UPDATE posts SET series_id = $1 WHERE id = ANY($2::int[])', [seriesId, postIds]);
    return (await this.getById(seriesId))!;
  }

  static async appendPost(seriesSlugOrName: string, postId: number): Promise<SeriesRecord> {
    let series = await this.getBySlug(seriesSlugOrName);
    if (!series) {
      const byTitle = await query('SELECT * FROM post_series WHERE title = $1', [seriesSlugOrName]);
      if (byTitle.rows[0]) series = await this.getById(Number(byTitle.rows[0].id));
    }
    if (!series) {
      series = await this.create({ title: seriesSlugOrName, slug: generateSlug(seriesSlugOrName) });
    }

    const last = series.posts[series.posts.length - 1];
    await query('UPDATE posts SET series_id = $1 WHERE id = $2', [series.id, postId]);
    if (last) {
      await query('UPDATE posts SET next_post_id = $1 WHERE id = $2', [postId, last.id]);
      await query('UPDATE posts SET prev_post_id = $1, next_post_id = NULL WHERE id = $2', [last.id, postId]);
    }
    return (await this.getById(series.id))!;
  }

  static async ensureForLinkedPost(postId: number): Promise<SeriesRecord | null> {
    const row = await query(
      'SELECT id, prev_post_id, next_post_id, series_id, title, excerpt, image_url FROM posts WHERE id = $1',
      [postId],
    );
    const post = row.rows[0];
    if (!post || (post.prev_post_id == null && post.next_post_id == null)) return null;

    const chainIds = await this.collectChainIds(postId);
    if (chainIds.length < 2) return null;

    const existing = await query(
      'SELECT series_id FROM posts WHERE id = ANY($1::int[]) AND series_id IS NOT NULL LIMIT 1',
      [chainIds],
    );
    const seriesId = existing.rows[0]?.series_id ? Number(existing.rows[0].series_id) : undefined;
    return this.saveChain(chainIds, { seriesId });
  }

  static async collectChainIds(postId: number): Promise<number[]> {
    const rows = await query('SELECT id, prev_post_id, next_post_id FROM posts');
    const byId = new Map(rows.rows.map((row: { id: number; prev_post_id: number | null; next_post_id: number | null }) => [row.id, row]));
    const start = byId.get(postId);
    if (!start) return [postId];

    let head = start;
    const seen = new Set<number>();
    while (head.prev_post_id && byId.has(head.prev_post_id) && !seen.has(head.id)) {
      seen.add(head.id);
      head = byId.get(head.prev_post_id)!;
    }

    const chain: number[] = [];
    let current: { id: number; next_post_id: number | null } | undefined = head;
    const local = new Set<number>();
    while (current && !local.has(current.id)) {
      local.add(current.id);
      chain.push(current.id);
      current = current.next_post_id ? byId.get(current.next_post_id) : undefined;
    }
    return chain;
  }
}
