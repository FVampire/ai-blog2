import { query, getClient, createDatabaseAdapter } from '../db';
import { BaseRepository } from './BaseRepository';
import { NextRequest, NextResponse } from 'next/server';

interface Comment {
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

interface PaginationOptions {
  page: number;
  limit: number;
}

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CommentRepository extends BaseRepository {
  /**
   * 获取所有评论
   */
  static async getAllComments(request?: NextRequest, response?: NextResponse): Promise<Comment[]> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getAllCommentsSupabase(request, response);
    }

    const result = await query(
      `
      SELECT
        c.id, c.content, c.post_id, c.author_name, c.author_email,
        c.status, c.created_at, c.updated_at,
        p.title as post_title
      FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      ORDER BY c.created_at DESC
      `
    );

    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      postId: row.post_id,
      postTitle: row.post_title,
      authorName: row.author_name,
      authorEmail: row.author_email,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Supabase模式下获取所有评论
   */
  private static async getAllCommentsSupabase(request?: NextRequest, response?: NextResponse): Promise<Comment[]> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, content, post_id, author_name, author_email,
        status, created_at, updated_at,
        posts!inner(title)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return (data || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      postId: comment.post_id,
      postTitle: comment.posts?.title,
      authorName: comment.author_name,
      authorEmail: comment.author_email,
      status: comment.status,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    }));
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
    request?: NextRequest;
    response?: NextResponse;
  } = {}): Promise<PaginationResult<Comment>> {
    const { page = 1, limit = 10, search, status, postId, request, response } = options;

    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getCommentsSupabase({ page, limit, search, status, postId, request, response });
    }

    const offset = (page - 1) * limit;

    // 构建查询
    let queryText = `
      SELECT
        c.id, c.content, c.post_id, c.author_name, c.author_email,
        c.status, c.created_at, c.updated_at,
        p.title as post_title
      FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // 添加搜索条件
    if (search) {
      queryText += ` AND (c.content ILIKE $${paramIndex} OR c.author_name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 添加状态筛选
    if (status && status !== 'all') {
      queryText += ` AND c.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // 添加文章ID筛选
    if (postId) {
      queryText += ` AND c.post_id = $${paramIndex}`;
      queryParams.push(postId);
      paramIndex++;
    }

    queryText += `
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    // 执行查询
    const result = await query(queryText, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM comments c WHERE 1=1';
    const countParams: any[] = [];

    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (c.content ILIKE $${countParamIndex} OR c.author_name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (status && status !== 'all') {
      countQuery += ` AND c.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (postId) {
      countQuery += ` AND c.post_id = $${countParamIndex}`;
      countParams.push(postId);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // 格式化响应
    const comments = result.rows.map(row => ({
      id: row.id,
      content: row.content,
      postId: row.post_id,
      postTitle: row.post_title,
      authorName: row.author_name,
      authorEmail: row.author_email,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Supabase模式下分页获取评论
   */
  private static async getCommentsSupabase(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    postId?: number;
    request?: NextRequest;
    response?: NextResponse;
  }): Promise<PaginationResult<Comment>> {
    const { page = 1, limit = 10, search, status, postId, request, response } = options;
    const { offset } = this.buildPaginationParams(page, limit);

    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 构建查询
    let query = supabase
      .from('comments')
      .select(`
        id, content, post_id, author_name, author_email,
        status, created_at, updated_at,
        posts!inner(title)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 添加搜索条件
    if (search) {
      query = query.or(`content.ilike.%${search}%,author_name.ilike.%${search}%`);
    }

    // 添加状态筛选
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 添加文章ID筛选
    if (postId) {
      query = query.eq('post_id', postId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    const total = count || 0;

    // 格式化响应
    const comments = (data || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      postId: comment.post_id,
      postTitle: comment.posts?.title,
      authorName: comment.author_name,
      authorEmail: comment.author_email,
      status: comment.status,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    }));

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 通过ID获取评论
   */
  static async getCommentById(id: number, request?: NextRequest, response?: NextResponse): Promise<Comment | null> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getCommentByIdSupabase(id, request, response);
    }

    const result = await query(
      `
      SELECT
        c.id, c.content, c.post_id, c.author_name, c.author_email,
        c.status, c.created_at, c.updated_at,
        p.title as post_title
      FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      WHERE c.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      content: row.content,
      postId: row.post_id,
      postTitle: row.post_title,
      authorName: row.author_name,
      authorEmail: row.author_email,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下通过ID获取评论
   */
  private static async getCommentByIdSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<Comment | null> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, content, post_id, author_name, author_email,
        status, created_at, updated_at,
        posts!inner(title)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Resource not found
        return null;
      }
      throw new Error(`Supabase query error: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      content: data.content,
      postId: data.post_id,
      postTitle: data.posts?.title,
      authorName: data.author_name,
      authorEmail: data.author_email,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * 获取文章的评论
   */
  static async getCommentsByPostId(postId: number, options: {
    status?: 'approved' | 'all';
    request?: NextRequest;
    response?: NextResponse;
  } = {}): Promise<Comment[]> {
    const { status = 'approved', request, response } = options;

    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getCommentsByPostIdSupabase(postId, { status, request, response });
    }

    let queryText = `
      SELECT
        c.id, c.content, c.post_id, c.author_name, c.author_email,
        c.status, c.created_at, c.updated_at
      FROM comments c
      WHERE c.post_id = $1
    `;

    const queryParams: any[] = [postId];

    if (status !== 'all') {
      queryText += ' AND c.status = $2';
      queryParams.push(status);
    }

    queryText += ' ORDER BY c.created_at ASC';

    const result = await query(queryText, queryParams);

    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      postId: row.post_id,
      authorName: row.author_name,
      authorEmail: row.author_email,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Supabase模式下获取文章的评论
   */
  private static async getCommentsByPostIdSupabase(postId: number, options: {
    status?: 'approved' | 'all';
    request?: NextRequest;
    response?: NextResponse;
  }): Promise<Comment[]> {
    const { status = 'approved', request, response } = options;

    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 构建查询
    let query = supabase
      .from('comments')
      .select(`
        id, content, post_id, author_name, author_email,
        status, created_at, updated_at
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    // 添加状态筛选
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return (data || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      postId: comment.post_id,
      authorName: comment.author_name,
      authorEmail: comment.author_email,
      status: comment.status,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    }));
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
  }, request?: NextRequest, response?: NextResponse): Promise<Comment> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.createCommentSupabase(data, request, response);
    }

    // 检查文章是否存在
    const postCheck = await query('SELECT id, title FROM posts WHERE id = $1', [data.postId]);
    if (postCheck.rows.length === 0) {
      throw new Error('文章不存在');
    }

    const result = await query(
      `
      INSERT INTO comments (content, post_id, author_name, author_email, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, content, post_id, author_name, author_email, status, created_at, updated_at
      `,
      [
        data.content,
        data.postId,
        data.authorName,
        data.authorEmail || null,
        data.status || 'pending'
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      content: row.content,
      postId: row.post_id,
      postTitle: postCheck.rows[0].title,
      authorName: row.author_name,
      authorEmail: row.author_email,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下创建评论
   */
  private static async createCommentSupabase(data: {
    content: string;
    postId: number;
    authorName: string;
    authorEmail?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'spam';
  }, request?: NextRequest, response?: NextResponse): Promise<Comment> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 检查文章是否存在
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('id', data.postId)
      .single();

    if (postError) {
      if (postError.code === 'PGRST116') {
        throw new Error('文章不存在');
      }
      throw new Error(`Supabase post check error: ${postError.message}`);
    }

    if (!post) {
      throw new Error('文章不存在');
    }

    const commentData = {
      content: data.content,
      post_id: data.postId,
      author_name: data.authorName,
      author_email: data.authorEmail || null,
      status: data.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert([commentData])
      .select(`
        id, content, post_id, author_name, author_email,
        status, created_at, updated_at
      `)
      .single();

    if (insertError) {
      throw new Error(`Supabase insert error: ${insertError.message}`);
    }

    return {
      id: newComment.id,
      content: newComment.content,
      postId: newComment.post_id,
      postTitle: post.title,
      authorName: newComment.author_name,
      authorEmail: newComment.author_email,
      status: newComment.status,
      createdAt: newComment.created_at,
      updatedAt: newComment.updated_at,
    };
  }

  /**
   * 更新评论
   */
  static async updateComment(id: number, data: {
    content?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'spam';
  }, request?: NextRequest, response?: NextResponse): Promise<Comment> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.updateCommentSupabase(id, data, request, response);
    }

    // 构建动态更新 SQL
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.content !== undefined) {
      updateFields.push(`content = $${paramIndex}`);
      updateValues.push(data.content);
      paramIndex++;
    }

    if (data.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(data.status);
      paramIndex++;
    }

    // 如果没有任何字段需要更新
    if (updateFields.length === 0) {
      // 获取当前评论信息
      const currentComment = await this.getCommentById(id);
      if (!currentComment) {
        throw new Error('评论不存在');
      }
      return currentComment;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id); // 最后一个参数是 ID

    const updateQuery = `
      UPDATE comments
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, content, post_id, author_name, author_email, status, created_at, updated_at
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      throw new Error('评论不存在');
    }

    const row = result.rows[0];

    // 获取文章标题
    const postResult = await query('SELECT title FROM posts WHERE id = $1', [row.post_id]);
    const postTitle = postResult.rows.length > 0 ? postResult.rows[0].title : undefined;

    return {
      id: row.id,
      content: row.content,
      postId: row.post_id,
      postTitle,
      authorName: row.author_name,
      authorEmail: row.author_email,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下更新评论
   */
  private static async updateCommentSupabase(id: number, data: {
    content?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'spam';
  }, request?: NextRequest, response?: NextResponse): Promise<Comment> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 检查评论是否存在
    const { data: existingComment, error: checkError } = await supabase
      .from('comments')
      .select('id, post_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        throw new Error('评论不存在');
      }
      throw new Error(`Supabase check error: ${checkError.message}`);
    }

    if (!existingComment) {
      throw new Error('评论不存在');
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // 只更新传入的字段（区分 undefined 和空值）
    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    // 更新评论
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, content, post_id, author_name, author_email,
        status, created_at, updated_at
      `)
      .single();

    if (updateError) {
      throw new Error(`Supabase update error: ${updateError.message}`);
    }

    // 获取文章标题
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('title')
      .eq('id', updatedComment.post_id)
      .single();

    const postTitle = postError ? undefined : post?.title;

    return {
      id: updatedComment.id,
      content: updatedComment.content,
      postId: updatedComment.post_id,
      postTitle,
      authorName: updatedComment.author_name,
      authorEmail: updatedComment.author_email,
      status: updatedComment.status,
      createdAt: updatedComment.created_at,
      updatedAt: updatedComment.updated_at,
    };
  }

  /**
   * 删除评论
   */
  static async deleteComment(id: number, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.deleteCommentSupabase(id, request, response);
    }

    const result = await query('DELETE FROM comments WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Supabase模式下删除评论
   */
  private static async deleteCommentSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return true;
  }

  /**
   * 批量更新评论状态
   */
  static async updateCommentsStatus(ids: number[], status: 'pending' | 'approved' | 'rejected' | 'spam', request?: NextRequest, response?: NextResponse): Promise<number> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.updateCommentsStatusSupabase(ids, status, request, response);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        'UPDATE comments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
        [status, ids]
      );

      await client.query('COMMIT');

      return result.rowCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Supabase模式下批量更新评论状态
   */
  private static async updateCommentsStatusSupabase(ids: number[], status: 'pending' | 'approved' | 'rejected' | 'spam', request?: NextRequest, response?: NextResponse): Promise<number> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('comments')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .in('id', ids)
      .select('id');

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    return data ? data.length : 0;
  }

  /**
   * 获取评论统计数据
   */
  static async getCommentStats(request?: NextRequest, response?: NextResponse): Promise<{
    totalComments: number;
    pendingComments: number;
    approvedComments: number;
    rejectedComments: number;
    spamComments: number;
  }> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getCommentStatsSupabase(request, response);
    }

    const result = await query(
      `
      SELECT
        COUNT(*) as total_comments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_comments,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_comments,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_comments,
        COUNT(*) FILTER (WHERE status = 'spam') as spam_comments
      FROM comments
      `
    );

    const row = result.rows[0];
    return {
      totalComments: parseInt(row.total_comments),
      pendingComments: parseInt(row.pending_comments),
      approvedComments: parseInt(row.approved_comments),
      rejectedComments: parseInt(row.rejected_comments),
      spamComments: parseInt(row.spam_comments),
    };
  }

  /**
   * Supabase模式下获取评论统计数据
   */
  private static async getCommentStatsSupabase(request?: NextRequest, response?: NextResponse): Promise<{
    totalComments: number;
    pendingComments: number;
    approvedComments: number;
    rejectedComments: number;
    spamComments: number;
  }> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 在Supabase中分别查询各个统计数据
    const [{ count: totalComments, error: totalError },
          { count: pendingComments, error: pendingError },
          { count: approvedComments, error: approvedError },
          { count: rejectedComments, error: rejectedError },
          { count: spamComments, error: spamError }] = await Promise.all([
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'spam')
    ]);

    if (totalError || pendingError || approvedError || rejectedError || spamError) {
      const errors = [totalError, pendingError, approvedError, rejectedError, spamError].filter(Boolean);
      throw new Error(`Supabase query error: ${errors.map(e => e?.message).join(', ')}`);
    }

    return {
      totalComments: totalComments || 0,
      pendingComments: pendingComments || 0,
      approvedComments: approvedComments || 0,
      rejectedComments: rejectedComments || 0,
      spamComments: spamComments || 0,
    };
  }

  /**
   * 获取文章的评论数量
   */
  static async getPostCommentCount(postId: number, request?: NextRequest, response?: NextResponse): Promise<number> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getPostCommentCountSupabase(postId, request, response);
    }

    const result = await query(
      'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND status = $2',
      [postId, 'approved']
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Supabase模式下获取文章的评论数量
   */
  private static async getPostCommentCountSupabase(postId: number, request?: NextRequest, response?: NextResponse): Promise<number> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('status', 'approved');

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * 获取最近的评论
   */
  static async getRecentComments(limit: number = 5, request?: NextRequest, response?: NextResponse): Promise<Comment[]> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getRecentCommentsSupabase(limit, request, response);
    }

    const result = await query(
      `
      SELECT
        c.id, c.content, c.post_id, c.author_name,
        c.status, c.created_at, c.updated_at,
        p.title as post_title
      FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      WHERE c.status = 'approved'
      ORDER BY c.created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      postId: row.post_id,
      postTitle: row.post_title,
      authorName: row.author_name,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Supabase模式下获取最近的评论
   */
  private static async getRecentCommentsSupabase(limit: number = 5, request?: NextRequest, response?: NextResponse): Promise<Comment[]> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, content, post_id, author_name,
        status, created_at, updated_at,
        posts!inner(title)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return (data || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      postId: comment.post_id,
      postTitle: comment.posts?.title,
      authorName: comment.author_name,
      status: comment.status,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    }));
  }
}