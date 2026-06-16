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
  static async createTag(data: { name: string; slug: string }): Promise<TagDTO> {
    const repo = await this.getRepo(Tag);

    const existing = await repo.createQueryBuilder('t')
      .where('t.slug = :slug OR t.name = :name', { slug: data.slug, name: data.name })
      .getOne();
    if (existing) {
      throw new Error('标签名称或slug已存在');
    }

    const tag = repo.create({ name: data.name, slug: data.slug });
    const saved = await repo.save(tag);
    return toDTO(saved);
  }

  /**
   * 更新标签
   */
  static async updateTag(id: number, data: { name?: string; slug?: string }): Promise<TagDTO> {
    const repo = await this.getRepo(Tag);

    const tag = await repo.findOne({ where: { id } });
    if (!tag) throw new Error('标签不存在');

    if (data.name !== undefined) tag.name = data.name;
    if (data.slug !== undefined) tag.slug = data.slug;

    const saved = await repo.save(tag);
    return toDTO(saved);
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
  static async getPopularTags(limit: number = 10): Promise<TagDTO[]> {
    const ds = await this.getDataSource();
    const result = await ds.query(`
      SELECT t.id, t.name, t.slug, t.color, t.created_at, t.updated_at
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY COUNT(pt.post_id) DESC
      LIMIT $1
    `, [limit]);

    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}
