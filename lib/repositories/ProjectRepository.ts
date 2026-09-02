import { exposeMediaUrl, storeMediaUrl } from '../media-url';
import { BaseRepository } from './BaseRepository';
import { Project } from '../entities/Project';

interface ProjectDTO {
  id: number;
  name: string;
  slug: string;
  description?: string;
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  status: 'active' | 'archived';
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  postCount?: number;
}

interface ProjectPostDTO {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt?: Date;
}

function toDTO(project: Project, postCount?: number): ProjectDTO {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    techStack: project.techStack || [],
    repoUrl: project.repoUrl,
    demoUrl: project.demoUrl,
    imageUrl: exposeMediaUrl(project.imageUrl),
    status: project.status,
    featured: project.featured,
    sortOrder: project.sortOrder,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    postCount,
  };
}

export class ProjectRepository extends BaseRepository {
  static async getAllProjects(options: {
    featured?: boolean;
    status?: string;
  } = {}): Promise<ProjectDTO[]> {
    const ds = await this.getDataSource();
    let query = `
      SELECT p.*, COUNT(pp.post_id) as post_count
      FROM projects p
      LEFT JOIN project_posts pp ON p.id = pp.project_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let idx = 1;

    if (options.status) {
      query += ` AND p.status = $${idx}`;
      params.push(options.status);
      idx++;
    } else {
      query += ` AND p.status = 'active'`;
    }

    if (options.featured) {
      query += ` AND p.featured = true`;
    }

    query += ` GROUP BY p.id ORDER BY p.sort_order ASC, p.created_at DESC`;

    const rows = await ds.query(query, params);
    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as number,
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string | undefined,
      techStack: row.tech_stack as string[] || [],
      repoUrl: row.repo_url as string | undefined,
      demoUrl: row.demo_url as string | undefined,
      imageUrl: exposeMediaUrl(row.image_url as string | undefined) || undefined,
      status: row.status as 'active' | 'archived',
      featured: row.featured as boolean,
      sortOrder: row.sort_order as number,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
      postCount: parseInt(row.post_count as string) || 0,
    }));
  }

  static async getProjectBySlug(slug: string): Promise<ProjectDTO | null> {
    const repo = await this.getRepo(Project);
    const project = await repo.findOne({ where: { slug } });
    if (!project) return null;

    const ds = await this.getDataSource();
    const countResult = await ds.query(
      'SELECT COUNT(*) FROM project_posts WHERE project_id = $1',
      [project.id]
    );
    const postCount = parseInt(countResult[0].count);

    return toDTO(project, postCount);
  }

  static async getProjectPosts(projectId: number): Promise<ProjectPostDTO[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.image_url, p.published_at
      FROM posts p
      INNER JOIN project_posts pp ON p.id = pp.post_id
      WHERE pp.project_id = $1 AND p.status = 'published'
      ORDER BY p.published_at DESC
    `, [projectId]);

    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as number,
      title: row.title as string,
      slug: row.slug as string,
      excerpt: row.excerpt as string | undefined,
      imageUrl: exposeMediaUrl(row.image_url as string | undefined) || undefined,
      publishedAt: row.published_at as Date | undefined,
    }));
  }

  static async createProject(data: {
    name: string;
    slug: string;
    description?: string;
    techStack?: string[];
    repoUrl?: string;
    demoUrl?: string;
    imageUrl?: string;
    featured?: boolean;
    sortOrder?: number;
  }): Promise<ProjectDTO> {
    const repo = await this.getRepo(Project);

    const existing = await repo.findOne({ where: { slug: data.slug } });
    if (existing) throw new Error('项目 slug 已存在');

    const project = repo.create({
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      techStack: data.techStack || [],
      repoUrl: data.repoUrl,
      demoUrl: data.demoUrl,
      imageUrl: storeMediaUrl(data.imageUrl),
      featured: data.featured || false,
      sortOrder: data.sortOrder || 0,
      status: 'active',
    });

    const saved = await repo.save(project);
    return toDTO(saved, 0);
  }

  static async linkPostToProject(projectId: number, postId: number): Promise<void> {
    const ds = await this.getDataSource();
    await ds.query(
      'INSERT INTO project_posts (project_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [projectId, postId]
    );
  }

  static async linkPostBySlug(projectSlug: string, postId: number): Promise<void> {
    const project = await this.getProjectBySlug(projectSlug);
    if (!project) throw new Error(`项目 "${projectSlug}" 不存在`);
    await this.linkPostToProject(project.id, postId);
  }

  static async getProjectBySlugOrName(slugOrName: string): Promise<ProjectDTO | null> {
    const repo = await this.getRepo(Project);
    const project = await repo.findOne({
      where: [{ slug: slugOrName }, { name: slugOrName }],
    });
    if (!project) return null;
    return toDTO(project);
  }

  static async getProjectById(id: number): Promise<ProjectDTO | null> {
    const repo = await this.getRepo(Project);
    const project = await repo.findOne({ where: { id } });
    if (!project) return null;

    const ds = await this.getDataSource();
    const countResult = await ds.query(
      'SELECT COUNT(*) FROM project_posts WHERE project_id = $1',
      [id]
    );
    return toDTO(project, parseInt(countResult[0].count));
  }

  static async getAllProjectsAdmin(): Promise<ProjectDTO[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(`
      SELECT p.*, COUNT(pp.post_id) as post_count
      FROM projects p
      LEFT JOIN project_posts pp ON p.id = pp.project_id
      GROUP BY p.id
      ORDER BY p.sort_order ASC, p.created_at DESC
    `);
    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as number,
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string | undefined,
      techStack: row.tech_stack as string[] || [],
      repoUrl: row.repo_url as string | undefined,
      demoUrl: row.demo_url as string | undefined,
      imageUrl: exposeMediaUrl(row.image_url as string | undefined) || undefined,
      status: row.status as 'active' | 'archived',
      featured: row.featured as boolean,
      sortOrder: row.sort_order as number,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
      postCount: parseInt(row.post_count as string) || 0,
    }));
  }

  static async updateProject(id: number, data: {
    name?: string;
    slug?: string;
    description?: string;
    techStack?: string[];
    repoUrl?: string;
    demoUrl?: string;
    imageUrl?: string;
    featured?: boolean;
    sortOrder?: number;
    status?: 'active' | 'archived';
  }): Promise<ProjectDTO> {
    const repo = await this.getRepo(Project);
    const project = await repo.findOne({ where: { id } });
    if (!project) throw new Error('项目不存在');

    if (data.slug && data.slug !== project.slug) {
      const existing = await repo.findOne({ where: { slug: data.slug } });
      if (existing) throw new Error('项目 slug 已存在');
    }

    if (data.name !== undefined) project.name = data.name;
    if (data.slug !== undefined) project.slug = data.slug;
    if (data.description !== undefined) project.description = data.description;
    if (data.techStack !== undefined) project.techStack = data.techStack;
    if (data.repoUrl !== undefined) project.repoUrl = data.repoUrl;
    if (data.demoUrl !== undefined) project.demoUrl = data.demoUrl;
    if (data.imageUrl !== undefined) project.imageUrl = storeMediaUrl(data.imageUrl);
    if (data.featured !== undefined) project.featured = data.featured;
    if (data.sortOrder !== undefined) project.sortOrder = data.sortOrder;
    if (data.status !== undefined) project.status = data.status;

    const saved = await repo.save(project);
    return (await this.getProjectById(saved.id))!;
  }

  static async deleteProject(id: number): Promise<boolean> {
    const ds = await this.getDataSource();
    await ds.query('DELETE FROM project_posts WHERE project_id = $1', [id]);
    const repo = await this.getRepo(Project);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  static async setLinkedPosts(projectId: number, postIds: number[]): Promise<void> {
    const ds = await this.getDataSource();
    await ds.query('DELETE FROM project_posts WHERE project_id = $1', [projectId]);
    for (const postId of postIds) {
      await ds.query(
        'INSERT INTO project_posts (project_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [projectId, postId]
      );
    }
  }

  static async getLinkedPostIds(projectId: number): Promise<number[]> {
    const ds = await this.getDataSource();
    const rows = await ds.query(
      'SELECT post_id FROM project_posts WHERE project_id = $1',
      [projectId]
    );
    return rows.map((r: { post_id: number }) => r.post_id);
  }

  static async unlinkPost(projectId: number, postId: number): Promise<void> {
    const ds = await this.getDataSource();
    await ds.query(
      'DELETE FROM project_posts WHERE project_id = $1 AND post_id = $2',
      [projectId, postId]
    );
  }
}
