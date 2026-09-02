import { In } from 'typeorm';

import { Post } from '../entities/Post';
import { PostTag } from '../entities/PostTag';
import { Tag } from '../entities/Tag';
import { BaseRepository } from './BaseRepository';

interface PostDTO {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  authorId: number;
  authorName?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  prevPostId?: number;
  nextPostId?: number;
  seriesId?: number | null;
  seriesSlug?: string;
  seriesTitle?: string;
  categoryId?: number | null;
  category?: PostCategoryDTO;
  tags: TagDTO[];
}

interface PostCategoryDTO {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
}

interface TagDTO {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function toDTO(post: Post, authorName?: string, tags?: TagDTO[]): PostDTO {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    content: post.content || '',
    imageUrl: post.imageUrl || '',
    status: post.status,
    views: post.views,
    authorId: post.authorId || 0,
    authorName,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt,
    prevPostId: post.prevPostId,
    nextPostId: post.nextPostId,
    seriesId: post.seriesId ?? null,
    seriesSlug: post.series?.slug,
    seriesTitle: post.series?.title,
    categoryId: post.categoryId,
    category: post.category ? {
      id: post.category.id,
      name: post.category.name,
      slug: post.category.slug,
      description: post.category.description,
      color: post.category.color,
    } : undefined,
    tags: tags || [],
  };
}

function extractTags(post: Post): TagDTO[] {
  if (!post.tags) return [];
  return post.tags.map(t => ({ id: t.id, name: t.name, slug: t.slug, color: t.color }));
}

export class PostRepository extends BaseRepository {
  /**
   * 获取文章列表（公开）
   */
  static async getPublicPosts(options: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  } = {}): Promise<PaginationResult<Omit<PostDTO, 'content'>>> {
    const { page = 1, limit = 10, search, category } = options;
    const ds = await this.getDataSource();
    const offset = (page - 1) * limit;

    const filters = ["p.status = 'published'"];
    const filterParams: unknown[] = [];

    if (search) {
      filterParams.push(`%${search}%`);
      filters.push(`(p.title ILIKE $${filterParams.length} OR u.username ILIKE $${filterParams.length})`);
    }

    if (category) {
      filterParams.push(category);
      filters.push(`pc.slug = $${filterParams.length}`);
    }

    const queryText = `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        CASE WHEN pc.id IS NULL THEN NULL ELSE json_build_object(
          'id', pc.id,
          'name', pc.name,
          'slug', pc.slug,
          'description', pc.description,
          'color', pc.color
        ) END AS category,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'color', t.color)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_categories pc ON p.category_id = pc.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE ${filters.join(' AND ')}
      GROUP BY p.id, u.username, pc.id
      ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
      LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}
    `;

    const rows = await ds.query(queryText, [...filterParams, limit, offset]);

    const countQuery = `
      SELECT COUNT(*)
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_categories pc ON p.category_id = pc.id
      WHERE ${filters.join(' AND ')}
    `;

    const countResult = await ds.query(countQuery, filterParams);
    const total = parseInt(countResult[0].count);

    const data = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      imageUrl: row.image_url || '',
      views: row.views,
      authorName: row.author_name,
      publishedAt: row.published_at,
      category: row.category || undefined,
      tags: row.tags,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取管理员文章列表
   */
  static async getAdminPosts(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    attention?: 'cover' | 'category';
  } = {}): Promise<PaginationResult<PostDTO>> {
    const { page = 1, limit = 10, status, search, attention } = options;
    const repo = await this.getRepo(Post);

    const qb = repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.tags', 't')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoin('p.author', 'u')
      .addSelect(['u.id', 'u.username']);

    if (status && status !== 'all') {
      qb.andWhere('p.status = :status', { status });
    }
    if (search) {
      qb.andWhere('(p.title ILIKE :search OR u.username ILIKE :search)', { search: `%${search}%` });
    }
    if (attention === 'cover') qb.andWhere("COALESCE(NULLIF(TRIM(p.image_url), ''), '') = ''");
    if (attention === 'category') qb.andWhere('p.category_id IS NULL');

    qb.orderBy('p.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await qb.getManyAndCount();

    const data = posts.map(p => toDTO(p, p.author?.username, extractTags(p)));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 通过ID获取文章
   */
  static async getPostById(id: number): Promise<PostDTO | null> {
    const repo = await this.getRepo(Post);
    const post = await repo.findOne({
      where: { id },
      relations: { tags: true, author: true, category: true, series: true },
    });
    if (!post) return null;
    return toDTO(post, post.author?.username, extractTags(post));
  }

  static async getPostBySlugAnyStatus(slug: string): Promise<PostDTO | null> {
    const repo = await this.getRepo(Post);
    const post = await repo.findOne({
      where: { slug },
      relations: { tags: true, author: true, category: true, series: true },
    });
    if (!post) return null;
    return toDTO(post, post.author?.username, extractTags(post));
  }

  /**
   * 通过slug获取文章
   */
  static async getPostBySlug(slug: string): Promise<PostDTO | null> {
    const repo = await this.getRepo(Post);
    const post = await repo.findOne({
      where: { slug, status: 'published' },
      relations: { tags: true, author: true, category: true, series: true },
    });
    if (!post) return null;
    return toDTO(post, post.author?.username, extractTags(post));
  }

  /**
   * 创建文章
   */
  static async createPost(data: {
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    imageUrl?: string;
    status: 'draft' | 'published' | 'archived';
    authorId: number;
    categoryId?: number | null;
    seriesId?: number | null;
    tagIds?: number[];
  }): Promise<PostDTO> {
    const ds = await this.getDataSource();
    const repo = ds.getRepository(Post);
    const tagRepo = ds.getRepository(Tag);

    // 检查 slug 唯一性
    const existing = await repo.findOne({ where: { slug: data.slug } });
    if (existing) throw new Error('Slug已存在');

    const post = repo.create({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || '',
      content: data.content || '',
      imageUrl: data.imageUrl || '',
      status: data.status,
      authorId: data.authorId,
      categoryId: data.categoryId ?? null,
      seriesId: data.seriesId ?? null,
      publishedAt: data.status === 'published' ? new Date() : undefined,
    });

    const saved = await repo.save(post);

    // 关联标签
    if (data.tagIds && data.tagIds.length > 0) {
      const tags = await tagRepo.findBy({ id: In(data.tagIds) });
      saved.tags = tags;
      await repo.save(saved);
    }

    return (await this.getPostById(saved.id))!;
  }

  /**
   * 更新文章
   */
  static async updatePost(id: number, data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    imageUrl?: string;
    status?: 'draft' | 'published' | 'archived';
    tagIds?: number[];
    categoryId?: number | null;
    seriesId?: number | null;
    prevPostId?: number;
    nextPostId?: number;
  }): Promise<PostDTO> {
    const ds = await this.getDataSource();
    const repo = ds.getRepository(Post);
    const tagRepo = ds.getRepository(Tag);
    const postTagRepo = ds.getRepository(PostTag);

    const post = await repo.findOne({ where: { id }, relations: { tags: true } });
    if (!post) throw new Error('文章不存在');

    const oldPrevId = post.prevPostId;
    const oldNextId = post.nextPostId;

    // 更新字段
    if (data.title !== undefined) post.title = data.title;
    if (data.slug !== undefined) post.slug = data.slug;
    if (data.excerpt !== undefined) post.excerpt = data.excerpt;
    if (data.content !== undefined) post.content = data.content;
    if (data.imageUrl !== undefined) post.imageUrl = data.imageUrl;
    if (data.categoryId !== undefined) post.categoryId = data.categoryId;
    if (data.seriesId !== undefined) post.seriesId = data.seriesId;
    if (data.status !== undefined) {
      post.status = data.status;
      if (data.status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }
    if (data.prevPostId !== undefined) post.prevPostId = data.prevPostId;
    if (data.nextPostId !== undefined) post.nextPostId = data.nextPostId;

    await repo.save(post);

    // 更新标签
    if (data.tagIds !== undefined) {
      await postTagRepo.delete({ postId: id });
      if (data.tagIds.length > 0) {
        const tags = await tagRepo.findBy({ id: In(data.tagIds) });
        post.tags = tags;
        await repo.save(post);
      }
    }

    // 同步双向关联关系
    if (data.prevPostId !== undefined || data.nextPostId !== undefined) {
      if (data.prevPostId !== undefined) {
        if (oldPrevId && oldPrevId !== data.prevPostId) {
          await repo.createQueryBuilder()
            .update(Post)
            .set({ nextPostId: undefined })
            .where('id = :id AND next_post_id = :postId', { id: oldPrevId, postId: id })
            .execute();
        }
        if (data.prevPostId) {
          await repo.createQueryBuilder()
            .update(Post)
            .set({ nextPostId: id })
            .where('id = :id', { id: data.prevPostId })
            .execute();
        }
      }

      if (data.nextPostId !== undefined) {
        if (oldNextId && oldNextId !== data.nextPostId) {
          await repo.createQueryBuilder()
            .update(Post)
            .set({ prevPostId: undefined })
            .where('id = :id AND prev_post_id = :postId', { id: oldNextId, postId: id })
            .execute();
        }
        if (data.nextPostId) {
          await repo.createQueryBuilder()
            .update(Post)
            .set({ prevPostId: id })
            .where('id = :id', { id: data.nextPostId })
            .execute();
        }
      }
    }

    return (await this.getPostById(id))!;
  }

  /**
   * 删除文章
   */
  static async deletePost(id: number): Promise<boolean> {
    const repo = await this.getRepo(Post);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * 增加文章浏览量
   */
  static async incrementViews(id: number): Promise<number> {
    const ds = await this.getDataSource();
    const rows = await ds.query(
      'UPDATE posts SET views = views + 1 WHERE id = $1 RETURNING views',
      [id]
    );
    if (!rows.length) throw new Error('文章不存在');
    return Number(rows[0].views);
  }

  static async getAuthorName(): Promise<string> {
    const ds = await this.getDataSource();
    const setting = await ds.query(
      'SELECT value FROM settings WHERE key = $1 LIMIT 1',
      ['about_author_name']
    );
    if (setting[0]?.value) return String(setting[0].value);

    const user = await ds.query(
      'SELECT username FROM users WHERE role = $1 ORDER BY id LIMIT 1',
      ['admin']
    );
    return user[0]?.username || '五月的火';
  }

  static async getRelatedPosts(postId: number, limit = 5): Promise<Pick<PostDTO, 'id' | 'title' | 'slug'>[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(
      `SELECT p.id, p.title, p.slug
       FROM posts p
       INNER JOIN post_tags pt ON p.id = pt.post_id
       WHERE pt.tag_id IN (SELECT tag_id FROM post_tags WHERE post_id = $1)
         AND p.id != $1
         AND p.status = 'published'
       GROUP BY p.id, p.title, p.slug, p.published_at, p.created_at
       ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
       LIMIT $2`,
      [postId, limit]
    );
    return rows.map((r: { id: number; title: string; slug: string }) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
    }));
  }

  /**
   * 获取前后文章
   */
  static async getAdjacentPosts(id: number): Promise<{
    prevPost: Pick<PostDTO, 'id' | 'title' | 'slug'> | null;
    nextPost: Pick<PostDTO, 'id' | 'title' | 'slug'> | null;
  }> {
    const repo = await this.getRepo(Post);
    const post = await repo.findOne({ where: { id } });

    if (!post) return { prevPost: null, nextPost: null };

    let prevPost = null;
    let nextPost = null;

    if (post.prevPostId) {
      const prev = await repo.findOne({
        where: { id: post.prevPostId, status: 'published' },
      });
      if (prev) prevPost = { id: prev.id, title: prev.title, slug: prev.slug };
    }

    if (post.nextPostId) {
      const next = await repo.findOne({
        where: { id: post.nextPostId, status: 'published' },
      });
      if (next) nextPost = { id: next.id, title: next.title, slug: next.slug };
    }

    return { prevPost, nextPost };
  }

  /**
   * 获取热门文章
   */
  static async getPopularPosts(limit: number = 5): Promise<Omit<PostDTO, 'content'>[]> {
    const repo = await this.getRepo(Post);

    const posts = await repo.createQueryBuilder('p')
      .leftJoin('p.author', 'u')
      .addSelect('u.username')
      .where('p.status = :status', { status: 'published' })
      .orderBy('p.views', 'DESC')
      .take(limit)
      .getMany();

    return posts.map(p => {
      const dto = toDTO(p, (p as any).author?.username);
      const { content: _, ...rest } = dto;
      return rest;
    });
  }

  /**
   * 搜索文章
   */
  static async searchPosts(queryString: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<PaginationResult<Omit<PostDTO, 'content'>>> {
    const { page = 1, limit = 10 } = options;
    const ds = await this.getDataSource();

    const offset = (page - 1) * limit;

    const rows = await ds.query(`
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]') as tags,
        ts_rank_cd(to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '') || ' ' || COALESCE(p.content, '')),
                  plainto_tsquery('english', $1)) as rank
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = 'published'
        AND to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '') || ' ' || COALESCE(p.content, ''))
            @@ plainto_tsquery('english', $1)
      GROUP BY p.id, u.username, rank
      ORDER BY rank DESC, p.published_at DESC
      LIMIT $2 OFFSET $3
    `, [queryString, limit, offset]);

    const countResult = await ds.query(`
      SELECT COUNT(*) FROM posts p
      WHERE p.status = 'published'
        AND to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '') || ' ' || COALESCE(p.content, ''))
            @@ plainto_tsquery('english', $1)
    `, [queryString]);

    const total = parseInt(countResult[0].count);

    const data = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      imageUrl: row.image_url || '',
      views: row.views,
      authorName: row.author_name,
      publishedAt: row.published_at,
      tags: row.tags,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * ILIKE search that works for Chinese titles and excerpts.
   */
  static async searchPublishedLoose(queryString: string, limit = 8): Promise<Array<{
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    publishedAt?: Date;
  }>> {
    const text = queryString.trim();
    if (!text) return [];
    const ds = await this.getDataSource();
    const rows = await ds.query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.published_at
       FROM posts p
       WHERE p.status = 'published'
         AND (p.title ILIKE $1 OR COALESCE(p.excerpt, '') ILIKE $1 OR COALESCE(p.content, '') ILIKE $1)
       ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
       LIMIT $2`,
      [`%${text}%`, limit],
    );
    return rows.map((row: { id: number; title: string; slug: string; excerpt: string; published_at: Date }) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt || '',
      publishedAt: row.published_at,
    }));
  }
}
