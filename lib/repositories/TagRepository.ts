import { BaseRepository } from './BaseRepository';
import { Tag } from '../entities/Tag';
import { PostTag } from '../entities/PostTag';

interface TagDTO {
  id: number;
  name: string;
  slug: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function toDTO(tag: Tag): TagDTO {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}

export class TagRepository extends BaseRepository {
  /**
   * 获取所有标签
   */
  static async getAllTags(): Promise<TagDTO[]> {
    const repo = await this.getRepo(Tag);
    const tags = await repo.find({ order: { name: 'ASC' } });
    return tags.map(toDTO);
  }

  /**
   * 分页获取标签
   */
  static async getTags(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginationResult<TagDTO>> {
    const { page = 1, limit = 10, search } = options;
    const repo = await this.getRepo(Tag);

    const qb = repo.createQueryBuilder('t')
      .orderBy('t.name', 'ASC');

    if (search) {
      qb.andWhere('(t.name ILIKE :search OR t.slug ILIKE :search)', { search: `%${search}%` });
    }

    const [tags, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: tags.map(toDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 通过ID获取标签
   */
  static async getTagById(id: number): Promise<TagDTO | null> {
    const repo = await this.getRepo(Tag);
    const tag = await repo.findOne({ where: { id } });
    return tag ? toDTO(tag) : null;
  }

  /**
   * 通过slug获取标签
   */
  static async getTagBySlug(slug: string): Promise<TagDTO | null> {
    const repo = await this.getRepo(Tag);
    const tag = await repo.findOne({ where: { slug } });
    return tag ? toDTO(tag) : null;
  }

  /**
   * 创建标签
   */
  static async createTag(data: { name: string; slug: string; color?: string }): Promise<TagDTO> {
    const repo = await this.getRepo(Tag);

    const existing = await repo.createQueryBuilder('t')
      .where('t.slug = :slug OR t.name = :name', { slug: data.slug, name: data.name })
      .getOne();
    if (existing) {
      throw new Error('标签名称或slug已存在');
    }

    const tag = repo.create({
      name: data.name,
      slug: data.slug,
      color: data.color || '#FF6B6B',
    });
    const saved = await repo.save(tag);
    return toDTO(saved);
  }

  /**
   * 更新标签
   */
  static async updateTag(
    id: number,
    data: { name?: string; slug?: string; color?: string }
  ): Promise<TagDTO> {
    const repo = await this.getRepo(Tag);

    const tag = await repo.findOne({ where: { id } });
    if (!tag) throw new Error('标签不存在');

    if (data.name !== undefined) tag.name = data.name;
    if (data.slug !== undefined) tag.slug = data.slug;
    if (data.color !== undefined) tag.color = data.color;

    const saved = await repo.save(tag);
    return toDTO(saved);
  }

  /**
   * Merge a source tag into a target tag, then delete the source.
   * Posts already tagged with the target keep a single relation.
   */
  static async mergeTags(sourceId: number, targetId: number): Promise<void> {
    if (sourceId === targetId) {
      throw new Error('不能将标签合并到自身');
    }

    const ds = await this.getDataSource();
    await ds.transaction(async (manager) => {
      const source = await manager.findOne(Tag, { where: { id: sourceId } });
      const target = await manager.findOne(Tag, { where: { id: targetId } });
      if (!source || !target) throw new Error('标签不存在');

      await manager.query(
        `INSERT INTO post_tags (post_id, tag_id)
         SELECT post_id, $2 FROM post_tags WHERE tag_id = $1
         ON CONFLICT (post_id, tag_id) DO NOTHING`,
        [sourceId, targetId]
      );
      await manager.query('DELETE FROM post_tags WHERE tag_id = $1', [sourceId]);
      await manager.delete(Tag, { id: sourceId });
    });
  }

  /**
   * 删除标签
   */
  static async deleteTag(id: number): Promise<boolean> {
    const ds = await this.getDataSource();
    const postTagRepo = ds.getRepository(PostTag);
    const tagRepo = await this.getRepo(Tag);

    // 先删除关联
    await postTagRepo.delete({ tagId: id });
    const result = await tagRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * 获取标签关联的文章数量
   */
  static async getTagPostCount(tagId: number): Promise<number> {
    const ds = await this.getDataSource();
    const result = await ds.query(
      'SELECT COUNT(*) FROM post_tags WHERE tag_id = $1',
      [tagId]
    );
    return parseInt(result[0].count);
  }

  /**
   * 获取热门标签
   */
  static async getPopularTags(limit: number = 10): Promise<Array<TagDTO & { postCount: number }>> {
    const ds = await this.getDataSource();
    const result = await ds.query(`
      SELECT t.id, t.name, t.slug, t.color, t.created_at, t.updated_at,
             COUNT(DISTINCT p.id) as post_count
      FROM tags t
      INNER JOIN post_tags pt ON t.id = pt.tag_id
      INNER JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
      GROUP BY t.id
      ORDER BY post_count DESC
      LIMIT $1
    `, [limit]);

    return result.map((row: Record<string, unknown>) => ({
      id: row.id as number,
      name: row.name as string,
      slug: row.slug as string,
      color: row.color as string | undefined,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
      postCount: parseInt(String(row.post_count), 10),
    }));
  }

  static async getAllTagsWithCount(): Promise<Array<TagDTO & { postCount: number }>> {
    const ds = await this.getDataSource();
    const result = await ds.query(`
      SELECT t.id, t.name, t.slug, t.color, t.created_at, t.updated_at,
             COUNT(p.id) FILTER (WHERE p.status = 'published') as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      LEFT JOIN posts p ON pt.post_id = p.id
      GROUP BY t.id
      ORDER BY t.name ASC
    `);

    return result.map((row: Record<string, unknown>) => ({
      id: row.id as number,
      name: row.name as string,
      slug: row.slug as string,
      color: row.color as string | undefined,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
      postCount: parseInt(String(row.post_count), 10),
    }));
  }

  static async getPostsByTagSlug(
    slug: string,
    page = 1,
    limit = 6
  ): Promise<{
    tag: TagDTO & { postCount: number };
    posts: Array<{
      id: number;
      title: string;
      slug: string;
      excerpt: string;
      imageUrl: string;
      publishedAt: Date | null;
      tags: Array<{ name: string; slug: string; color: string }>;
    }>;
    total: number;
    totalPages: number;
  } | null> {
    const tag = await this.getTagBySlug(slug);
    if (!tag) return null;

    const ds = await this.getDataSource();
    const offset = (page - 1) * limit;

    const countResult = await ds.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM posts p
      INNER JOIN post_tags pt ON p.id = pt.post_id
      INNER JOIN tags t ON pt.tag_id = t.id AND t.slug = $1
      WHERE p.status = 'published'
    `, [slug]);
    const total = parseInt(countResult[0].count as string, 10);

    const rows = await ds.query(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.image_url, p.published_at,
             COALESCE(
               json_agg(
                 json_build_object('name', t2.name, 'slug', t2.slug, 'color', t2.color)
               ) FILTER (WHERE t2.id IS NOT NULL), '[]'
             ) as tags
      FROM posts p
      INNER JOIN post_tags pt ON p.id = pt.post_id
      INNER JOIN tags t ON pt.tag_id = t.id AND t.slug = $1
      LEFT JOIN post_tags pt2 ON p.id = pt2.post_id
      LEFT JOIN tags t2 ON pt2.tag_id = t2.id
      WHERE p.status = 'published'
      GROUP BY p.id
      ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [slug, limit, offset]);

    return {
      tag: { ...tag, postCount: total },
      posts: rows.map((r: Record<string, unknown>) => ({
        id: r.id as number,
        title: r.title as string,
        slug: r.slug as string,
        excerpt: (r.excerpt as string) || '',
        imageUrl: (r.image_url as string) || '',
        publishedAt: r.published_at as Date | null,
        tags: (r.tags as Array<{ name: string; slug: string; color: string }>) || [],
      })),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
