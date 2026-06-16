import { In } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Comment } from '../entities/Comment';
import { Post } from '../entities/Post';

interface CommentDTO {
  id: number;
  content: string;
  postId: number;
  postTitle?: string;
  authorName: string;
  authorEmail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
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

function toDTO(c: Comment, postTitle?: string): CommentDTO {
  return {
    id: c.id,
    content: c.content,
    postId: c.postId,
    postTitle,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export class CommentRepository extends BaseRepository {
  /**
   * 获取所有评论
   */
  static async getAllComments(): Promise<CommentDTO[]> {
    const repo = await this.getRepo(Comment);
    const comments = await repo.find({
      relations: { post: true },
      order: { createdAt: 'DESC' },
    });

    return comments.map(c => toDTO(c, c.post?.title));
  }

  /**
   * 分页获取评论
   */
  static async getComments(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    postId?: number;
  } = {}): Promise<PaginationResult<CommentDTO>> {
    const { page = 1, limit = 10, search, status, postId } = options;

    const repo = await this.getRepo(Comment);
    const qb = repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.post', 'post')
      .orderBy('c.created_at', 'DESC');

    if (search) {
      qb.andWhere('(c.content ILIKE :search OR c.author_name ILIKE :search)', { search: `%${search}%` });
    }

    if (status && status !== 'all') {
      qb.andWhere('c.status = :status', { status });
    }

    if (postId) {
      qb.andWhere('c.post_id = :postId', { postId });
    }

    const total = await qb.getCount();
    const comments = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: comments.map(c => toDTO(c, c.post?.title)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 通过ID获取评论
   */
  static async getCommentById(id: number): Promise<CommentDTO | null> {
    const repo = await this.getRepo(Comment);
    const comment = await repo.findOne({
      where: { id },
      relations: { post: true },
    });

    if (!comment) return null;
    return toDTO(comment, comment.post?.title);
  }

  /**
   * 获取文章的评论
   */
  static async getCommentsByPostId(postId: number, options: {
    status?: 'approved' | 'all';
  } = {}): Promise<CommentDTO[]> {
    const { status = 'approved' } = options;

    const repo = await this.getRepo(Comment);
    const where: any = { postId };
    if (status !== 'all') {
      where.status = status;
    }

    const comments = await repo.find({
      where,
      order: { createdAt: 'ASC' },
    });

    return comments.map(c => toDTO(c));
  }

  /**
   * 创建评论
   */
  static async createComment(data: {
    content: string;
    postId: number;
    authorName: string;
    authorEmail?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'spam';
  }): Promise<CommentDTO> {
    const ds = await this.getDataSource();
    const postRepo = ds.getRepository(Post);

    // 检查文章是否存在
    const post = await postRepo.findOne({ where: { id: data.postId } });
    if (!post) {
      throw new Error('文章不存在');
    }

    const repo = await this.getRepo(Comment);
    const comment = repo.create({
      content: data.content,
      postId: data.postId,
      authorName: data.authorName,
      authorEmail: data.authorEmail || undefined,
      status: data.status || 'pending',
    });

    const saved = await repo.save(comment) as Comment;
    return toDTO(saved, post.title);
  }

  /**
   * 更新评论
   */
  static async updateComment(id: number, data: {
    content?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'spam';
  }): Promise<CommentDTO> {
    const repo = await this.getRepo(Comment);
    const comment = await repo.findOne({ where: { id }, relations: { post: true } });
    if (!comment) {
      throw new Error('评论不存在');
    }

    if (data.content !== undefined) comment.content = data.content;
    if (data.status !== undefined) comment.status = data.status;

    const saved = await repo.save(comment);

    // 获取文章标题
    let postTitle = comment.post?.title;
    if (!postTitle) {
      const ds = await this.getDataSource();
      const post = await ds.getRepository(Post).findOne({ where: { id: saved.postId } });
      postTitle = post?.title;
    }

    return toDTO(saved, postTitle);
  }

  /**
   * 删除评论
   */
  static async deleteComment(id: number): Promise<boolean> {
    const repo = await this.getRepo(Comment);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * 批量更新评论状态
   */
  static async updateCommentsStatus(ids: number[], status: 'pending' | 'approved' | 'rejected' | 'spam'): Promise<number> {
    if (ids.length === 0) return 0;
    const repo = await this.getRepo(Comment);
    const result = await repo.update({ id: In(ids) }, { status });
    return result.affected ?? 0;
  }

  /**
   * 获取评论统计数据
   */
  static async getCommentStats(): Promise<{
    totalComments: number;
    pendingComments: number;
    approvedComments: number;
    rejectedComments: number;
    spamComments: number;
  }> {
    const ds = await this.getDataSource();
    const result = await ds.query(`
      SELECT
        COUNT(*) as total_comments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_comments,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_comments,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_comments,
        COUNT(*) FILTER (WHERE status = 'spam') as spam_comments
      FROM comments
    `);

    const row = result[0];
    return {
      totalComments: parseInt(row.total_comments),
      pendingComments: parseInt(row.pending_comments),
      approvedComments: parseInt(row.approved_comments),
      rejectedComments: parseInt(row.rejected_comments),
      spamComments: parseInt(row.spam_comments),
    };
  }

  /**
   * 获取文章的评论数量
   */
  static async getPostCommentCount(postId: number): Promise<number> {
    const repo = await this.getRepo(Comment);
    return await repo.count({ where: { postId, status: 'approved' } });
  }

  /**
   * 获取最近的评论
   */
  static async getRecentComments(limit: number = 5): Promise<CommentDTO[]> {
    const repo = await this.getRepo(Comment);
    const comments = await repo.find({
      where: { status: 'approved' },
      relations: { post: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return comments.map(c => toDTO(c, c.post?.title));
  }
}
