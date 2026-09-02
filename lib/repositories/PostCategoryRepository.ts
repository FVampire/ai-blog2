import { BaseRepository } from './BaseRepository';
import { PostCategory } from '../entities/PostCategory';

export interface PostCategoryWithCount {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  sortOrder: number;
  postCount: number;
}

interface PostCategoryRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  post_count: number | string;
}

export class PostCategoryRepository extends BaseRepository {
  static async getAllWithPostCount(): Promise<PostCategoryWithCount[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(`
      SELECT
        c.id, c.name, c.slug, c.description, c.color, c.sort_order,
        COUNT(p.id) FILTER (WHERE p.status = 'published')::int AS post_count
      FROM post_categories c
      LEFT JOIN posts p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `);

    return (rows as PostCategoryRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      color: row.color || '#6C757D',
      sortOrder: row.sort_order,
      postCount: Number(row.post_count),
    }));
  }

  static async getAll(): Promise<PostCategory[]> {
    const repo = await this.getRepo(PostCategory);
    return repo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  static async create(data: Pick<PostCategory, 'name' | 'slug' | 'color' | 'sortOrder'> & { description?: string }): Promise<PostCategory> {
    const repo = await this.getRepo(PostCategory);
    return repo.save(repo.create({ ...data, description: data.description || '' }));
  }

  static async update(id: number, data: Partial<Pick<PostCategory, 'name' | 'slug' | 'description' | 'color' | 'sortOrder'>>): Promise<PostCategory | null> {
    const repo = await this.getRepo(PostCategory);
    const category = await repo.findOne({ where: { id } });
    if (!category) return null;
    Object.assign(category, data);
    return repo.save(category);
  }

  static async delete(id: number): Promise<boolean> {
    const repo = await this.getRepo(PostCategory);
    const result = await repo.delete(id);
    return (result.affected || 0) > 0;
  }
}
