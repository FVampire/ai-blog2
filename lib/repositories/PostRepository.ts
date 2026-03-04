import { query, getClient, createDatabaseAdapter } from '../db';
import { BaseRepository } from './BaseRepository';
import { NextRequest, NextResponse } from 'next/server';

interface Post {
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
  tags: Tag[];
}

interface Tag {
  id: number;
  name: string;
  slug: string;
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

export class PostRepository extends BaseRepository {
  /**
   * 获取文章列表（公开）
   */
  static async getPublicPosts(options: {
    page?: number;
    limit?: number;
    search?: string;
    request?: NextRequest;
    response?: NextResponse;
  } = {}): Promise<PaginationResult<Omit<Post, 'content'>>> {
    const { page = 1, limit = 10, search, request, response } = options;

    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getPublicPostsSupabase({ page, limit, search, request, response });
    }

    const offset = (page - 1) * limit;

    // 构建查询
    let queryText = `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = 'published'
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // 添加搜索条件
    if (search) {
      queryText += ` AND (p.title ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY p.id, u.username
      ORDER BY p.published_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    // 执行查询
    const result = await query(queryText, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM posts p WHERE p.status = $1';
    const countParams: any[] = ['published'];

    if (search) {
      countQuery += ' AND (p.title ILIKE $2 OR EXISTS(SELECT 1 FROM users u WHERE u.id = p.author_id AND u.username ILIKE $2))';
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // 格式化响应
    const posts = result.rows.map(row => ({
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
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Supabase模式下的获取公开文章列表
   */
  private static async getPublicPostsSupabase(options: {
    page?: number;
    limit?: number;
    search?: string;
    request?: NextRequest;
    response?: NextResponse;
  }): Promise<PaginationResult<Omit<Post, 'content'>>> {
    const { page = 1, limit = 10, search, request, response } = options;
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
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        image_url,
        views,
        published_at,
        users:author_id (username),
        post_tags (
          tags (
            name
          )
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 添加搜索条件
    if (search) {
      query = query.or(`title.ilike.%${search}%,users.username.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    // 获取总数
    let countQuery = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,users.username.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Supabase count query error: ${countError.message}`);
    }

    const total = count || 0;

    // 格式化响应
    const posts = (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      imageUrl: post.image_url || '',
      views: post.views,
      authorName: post.users?.username || '',
      publishedAt: post.published_at,
      tags: post.post_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [],
    }));

    return {
      data: posts,
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
    request?: NextRequest;
    response?: NextResponse;
  } = {}): Promise<PaginationResult<Post>> {
    const { page = 1, limit = 10, status, search, request, response } = options;

    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getAdminPostsSupabase({ page, limit, status, search, request, response });
    }

    const offset = (page - 1) * limit;

    // 构建查询
    let queryText = `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.status, p.views, p.created_at, p.published_at,
        u.username as author_name, u.id as author_id,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // 添加状态筛选
    if (status && status !== 'all') {
      queryText += ` AND p.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // 添加搜索筛选
    if (search && search.length > 0) {
      queryText += ` AND (p.title ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY p.id, u.username, u.id
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    // 执行查询
    const result = await query(queryText, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (status && status !== 'all') {
      countQuery += ` AND p.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (search ? search.length > 0 : false) {
      countQuery += ` AND (p.title ILIKE $${countParamIndex} OR u.username ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // 格式化数据
    const posts: Post[] = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: '', // 不在列表中返回内容
      imageUrl: row.image_url,
      status: row.status,
      views: row.views,
      authorId: row.author_id,
      authorName: row.author_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
      tags: row.tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      })),
    }));

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Supabase模式下的获取管理员文章列表
   */
  private static async getAdminPostsSupabase(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    request?: NextRequest;
    response?: NextResponse;
  }): Promise<PaginationResult<Post>> {
    const { page = 1, limit = 10, status, search, request, response } = options;
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
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        image_url,
        status,
        views,
        created_at,
        published_at,
        users:author_id (id, username),
        post_tags (
          tags (
            id,
            name,
            slug
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 添加状态筛选
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 添加搜索筛选
    if (search) {
      query = query.or(`title.ilike.%${search}%,users.username.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    // 获取总数
    let countQuery = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // 添加状态筛选到计数查询
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    // 添加搜索筛选到计数查询
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,users.username.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Supabase count query error: ${countError.message}`);
    }

    const total = count || 0;

    // 格式化数据
    const posts: Post[] = (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: '', // 不在列表中返回内容
      imageUrl: post.image_url,
      status: post.status,
      views: post.views,
      authorId: post.users?.id || 0,
      authorName: post.users?.username || '',
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      publishedAt: post.published_at,
      tags: post.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
    }));

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 通过ID获取文章
   */
  static async getPostById(id: number, request?: NextRequest, response?: NextResponse): Promise<Post | null> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getPostByIdSupabase(id, request, response);
    }

    const result = await query(
      `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.content, p.image_url,
        p.status, p.views, p.created_at, p.updated_at, p.published_at,
        p.prev_post_id, p.next_post_id,
        u.username as author_name, u.id as author_id,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = $1
      GROUP BY p.id, u.username, u.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      imageUrl: row.image_url,
      status: row.status,
      views: row.views,
      authorId: row.author_id,
      authorName: row.author_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
      prevPostId: row.prev_post_id,
      nextPostId: row.next_post_id,
      tags: row.tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      })),
    };
  }

  /**
   * Supabase模式下通过ID获取文章
   */
  private static async getPostByIdSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<Post | null> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        image_url,
        status,
        views,
        created_at,
        updated_at,
        published_at,
        prev_post_id,
        next_post_id,
        users:author_id (id, username),
        post_tags (
          tags (
            id,
            name,
            slug
          )
        )
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
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      imageUrl: data.image_url,
      status: data.status,
      views: data.views,
      authorId: data.users?.id || 0,
      authorName: data.users?.username || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      publishedAt: data.published_at,
      prevPostId: data.prev_post_id,
      nextPostId: data.next_post_id,
      tags: data.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
    };
  }

  /**
   * 通过slug获取文章
   */
  static async getPostBySlug(slug: string, request?: NextRequest, response?: NextResponse): Promise<Post | null> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getPostBySlugSupabase(slug, request, response);
    }

    const result = await query(
      `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.content, p.image_url,
        p.status, p.views, p.created_at, p.updated_at, p.published_at,
        p.prev_post_id, p.next_post_id,
        u.username as author_name, u.id as author_id,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.slug = $1 AND p.status = 'published'
      GROUP BY p.id, u.username, u.id
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      imageUrl: row.image_url,
      status: row.status,
      views: row.views,
      authorId: row.author_id,
      authorName: row.author_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
      prevPostId: row.prev_post_id,
      nextPostId: row.next_post_id,
      tags: row.tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      })),
    };
  }

  /**
   * Supabase模式下通过slug获取文章
   */
  private static async getPostBySlugSupabase(slug: string, request?: NextRequest, response?: NextResponse): Promise<Post | null> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        image_url,
        status,
        views,
        created_at,
        updated_at,
        published_at,
        prev_post_id,
        next_post_id,
        users:author_id (id, username),
        post_tags (
          tags (
            id,
            name,
            slug
          )
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
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
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      imageUrl: data.image_url,
      status: data.status,
      views: data.views,
      authorId: data.users?.id || 0,
      authorName: data.users?.username || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      publishedAt: data.published_at,
      prevPostId: data.prev_post_id,
      nextPostId: data.next_post_id,
      tags: data.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
    };
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
    tagIds?: number[];
  }, request?: NextRequest, response?: NextResponse): Promise<Post> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.createPostSupabase(data, request, response);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 检查slug是否已存在
      const existCheck = await client.query('SELECT id FROM posts WHERE slug = $1', [data.slug]);
      if (existCheck.rows.length > 0) {
        throw new Error('Slug已存在');
      }

      // 创建文章
      const insertResult = await client.query(
        `
        INSERT INTO posts (title, slug, excerpt, content, image_url, status, author_id, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $6 = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)
        RETURNING *
        `,
        [
          data.title,
          data.slug,
          data.excerpt || '',
          data.content || '',
          data.imageUrl || '',
          data.status,
          data.authorId
        ]
      );

      const newPost = insertResult.rows[0];

      // 关联标签
      if (data.tagIds && Array.isArray(data.tagIds) && data.tagIds.length > 0) {
        const tagValues = data.tagIds.map((tagId, index) => `($1, $${index + 2})`).join(',');
        const tagParams = [newPost.id, ...data.tagIds];
        await client.query(
          `INSERT INTO post_tags (post_id, tag_id) VALUES ${tagValues}`,
          tagParams
        );
      }

      await client.query('COMMIT');

      // 获取完整的文章信息
      const post = await this.getPostById(newPost.id);
      if (!post) {
        throw new Error('创建文章后无法获取文章信息');
      }

      return post;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Supabase模式下创建文章
   */
  private static async createPostSupabase(data: {
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    imageUrl?: string;
    status: 'draft' | 'published' | 'archived';
    authorId: number;
    tagIds?: number[];
  }, request?: NextRequest, response?: NextResponse): Promise<Post> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 检查slug是否已存在
    const { data: existingPost, error: checkError } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existingPost) {
      throw new Error('Slug已存在');
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Supabase check error: ${checkError.message}`);
    }

    // 创建文章
    const postData = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || '',
      content: data.content || '',
      image_url: data.imageUrl || '',
      status: data.status,
      author_id: data.authorId,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
      views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Supabase insert error: ${insertError.message}`);
    }

    // 关联标签（如果提供了tagIds）
    if (data.tagIds && Array.isArray(data.tagIds) && data.tagIds.length > 0) {
      const tagRelations = data.tagIds.map(tagId => ({
        post_id: newPost.id,
        tag_id: tagId
      }));

      const { error: relationError } = await supabase
        .from('post_tags')
        .insert(tagRelations);

      if (relationError) {
        throw new Error(`Supabase tag relation error: ${relationError.message}`);
      }
    }

    // 获取完整的文章信息
    const post = await this.getPostById(newPost.id, request, response);
    if (!post) {
      throw new Error('创建文章后无法获取文章信息');
    }

    return post;
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
    prevPostId?: number;
    nextPostId?: number;
  }, request?: NextRequest, response?: NextResponse): Promise<Post> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.updatePostSupabase(id, data, request, response);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 查询当前文章的旧关联关系
      const oldPostResult = await client.query(
        'SELECT prev_post_id, next_post_id FROM posts WHERE id = $1',
        [id]
      );

      const oldPost = oldPostResult.rows[0];
      const oldPrevId = oldPost?.prev_post_id;
      const oldNextId = oldPost?.next_post_id;

      // 构建动态更新 SQL
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      // 只更新传入的字段（区分 undefined 和空值）
      if (data.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        updateValues.push(data.title);
        paramIndex++;
      }

      if (data.slug !== undefined) {
        updateFields.push(`slug = $${paramIndex}`);
        updateValues.push(data.slug);
        paramIndex++;
      }

      if (data.excerpt !== undefined) {
        updateFields.push(`excerpt = $${paramIndex}`);
        updateValues.push(data.excerpt);
        paramIndex++;
      }

      if (data.content !== undefined) {
        updateFields.push(`content = $${paramIndex}`);
        updateValues.push(data.content);
        paramIndex++;
      }

      if (data.imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex}`);
        updateValues.push(data.imageUrl);
        paramIndex++;
      }

      if (data.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(data.status);
        paramIndex++;

        // 如果状态改为 published 且之前没有发布时间，设置发布时间
        if (data.status === 'published') {
          updateFields.push(`published_at = COALESCE(published_at, CURRENT_TIMESTAMP)`);
        }
      }

      if (data.prevPostId !== undefined) {
        updateFields.push(`prev_post_id = $${paramIndex}`);
        updateValues.push(data.prevPostId);
        paramIndex++;
      }

      if (data.nextPostId !== undefined) {
        updateFields.push(`next_post_id = $${paramIndex}`);
        updateValues.push(data.nextPostId);
        paramIndex++;
      }

      // 如果没有任何字段需要更新，但有标签更新
      if (updateFields.length === 0 && (!data.tagIds || !Array.isArray(data.tagIds))) {
        throw new Error('没有需要更新的字段');
      }

      let updateResult;

      // 如果有字段需要更新
      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id); // 最后一个参数是 ID

        const updateQuery = `
          UPDATE posts
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        updateResult = await client.query(updateQuery, updateValues);

        if (updateResult.rows.length === 0) {
          throw new Error('文章不存在');
        }
      } else {
        // 只更新标签的情况，先查询文章是否存在
        const checkResult = await client.query('SELECT * FROM posts WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
          throw new Error('文章不存在');
        }
        updateResult = checkResult;
      }

      // Update tags
      if (data.tagIds !== undefined && Array.isArray(data.tagIds)) {
        // Delete existing tags
        await client.query('DELETE FROM post_tags WHERE post_id = $1', [id]);

        // Insert new tags
        if (data.tagIds.length > 0) {
          const tagValues = data.tagIds.map((tagId, index) => `($1, $${index + 2})`).join(',');
          const tagParams = [id, ...data.tagIds];
          await client.query(
            `INSERT INTO post_tags (post_id, tag_id) VALUES ${tagValues}`,
            tagParams
          );
        }
      }

      // 同步更新前后文章的关联关系（双向绑定）
      if (data.prevPostId !== undefined || data.nextPostId !== undefined) {
        // 处理上一篇文章的关系
        if (data.prevPostId !== undefined) {
          // 如果有旧的上一篇，清除旧上一篇的 next_post_id（如果指向当前文章）
          if (oldPrevId && oldPrevId !== data.prevPostId) {
            await client.query(
              `UPDATE posts
               SET next_post_id = NULL
               WHERE id = $1 AND next_post_id = $2`,
              [oldPrevId, id]
            );
          }

          // 如果设置了新的上一篇，更新新上一篇的 next_post_id 为当前文章
          if (data.prevPostId) {
            await client.query(
              `UPDATE posts
               SET next_post_id = $1
               WHERE id = $2`,
              [id, data.prevPostId]
            );
          }
        }

        // 处理下一篇文章的关系
        if (data.nextPostId !== undefined) {
          // 如果有旧的下一篇，清除旧下一篇的 prev_post_id（如果指向当前文章）
          if (oldNextId && oldNextId !== data.nextPostId) {
            await client.query(
              `UPDATE posts
               SET prev_post_id = NULL
               WHERE id = $1 AND prev_post_id = $2`,
              [oldNextId, id]
            );
          }

          // 如果设置了新的下一篇，更新新下一篇的 prev_post_id 为当前文章
          if (data.nextPostId) {
            await client.query(
              `UPDATE posts
               SET prev_post_id = $1
               WHERE id = $2`,
              [id, data.nextPostId]
            );
          }
        }
      }

      await client.query('COMMIT');

      // 获取完整的文章信息
      const post = await this.getPostById(id);
      if (!post) {
        throw new Error('更新文章后无法获取文章信息');
      }

      return post;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Supabase模式下更新文章
   */
  private static async updatePostSupabase(id: number, data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    imageUrl?: string;
    status?: 'draft' | 'published' | 'archived';
    tagIds?: number[];
    prevPostId?: number;
    nextPostId?: number;
  }, request?: NextRequest, response?: NextResponse): Promise<Post> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 检查文章是否存在
    const { data: existingPost, error: checkError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Supabase check error: ${checkError.message}`);
    }

    if (!existingPost) {
      throw new Error('文章不存在');
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // 只更新传入的字段（区分 undefined 和空值）
    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.slug !== undefined) {
      updateData.slug = data.slug;
    }

    if (data.excerpt !== undefined) {
      updateData.excerpt = data.excerpt;
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.imageUrl !== undefined) {
      updateData.image_url = data.imageUrl;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;

      // 如果状态改为 published 且之前没有发布时间，设置发布时间
      if (data.status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }

    if (data.prevPostId !== undefined) {
      updateData.prev_post_id = data.prevPostId;
    }

    if (data.nextPostId !== undefined) {
      updateData.next_post_id = data.nextPostId;
    }

    // 更新文章
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Supabase update error: ${updateError.message}`);
    }

    // 更新标签
    if (data.tagIds !== undefined && Array.isArray(data.tagIds)) {
      // 删除现有标签关联
      const { error: deleteError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', id);

      if (deleteError) {
        throw new Error(`Supabase delete tags error: ${deleteError.message}`);
      }

      // 插入新标签关联
      if (data.tagIds.length > 0) {
        const tagRelations = data.tagIds.map(tagId => ({
          post_id: id,
          tag_id: tagId
        }));

        const { error: insertError } = await supabase
          .from('post_tags')
          .insert(tagRelations);

        if (insertError) {
          throw new Error(`Supabase insert tags error: ${insertError.message}`);
        }
      }
    }

    // 获取完整的文章信息
    const post = await this.getPostById(id, request, response);
    if (!post) {
      throw new Error('更新文章后无法获取文章信息');
    }

    return post;
  }

  /**
   * 删除文章
   */
  static async deletePost(id: number, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.deletePostSupabase(id, request, response);
    }

    const result = await query('DELETE FROM posts WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Supabase模式下删除文章
   */
  private static async deletePostSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return true;
  }

  /**
   * 增加文章浏览量
   */
  static async incrementViews(id: number, request?: NextRequest, response?: NextResponse): Promise<void> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.incrementViewsSupabase(id, request, response);
    }

    await query(
      'UPDATE posts SET views = views + 1 WHERE id = $1',
      [id]
    );
  }

  /**
   * Supabase模式下增加文章浏览量
   */
  private static async incrementViewsSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<void> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 首先获取当前浏览量
    const { data: post, error: selectError } = await supabase
      .from('posts')
      .select('views')
      .eq('id', id)
      .single();

    if (selectError) {
      throw new Error(`Supabase select error: ${selectError.message}`);
    }

    if (!post) {
      throw new Error('文章不存在');
    }

    // 更新浏览量
    const { error: updateError } = await supabase
      .from('posts')
      .update({ views: post.views + 1 })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Supabase update error: ${updateError.message}`);
    }
  }

  /**
   * 获取前后文章
   */
  static async getAdjacentPosts(id: number, request?: NextRequest, response?: NextResponse): Promise<{
    prevPost: Pick<Post, 'id' | 'title' | 'slug'> | null;
    nextPost: Pick<Post, 'id' | 'title' | 'slug'> | null;
  }> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getAdjacentPostsSupabase(id, request, response);
    }

    const result = await query(
      `
      SELECT
        prev_post_id,
        next_post_id
      FROM posts
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return { prevPost: null, nextPost: null };
    }

    const row = result.rows[0];
    let prevPost = null;
    let nextPost = null;

    if (row.prev_post_id) {
      const prevResult = await query(
        'SELECT id, title, slug FROM posts WHERE id = $1 AND status = $2',
        [row.prev_post_id, 'published']
      );
      if (prevResult.rows.length > 0) {
        const prevRow = prevResult.rows[0];
        prevPost = {
          id: prevRow.id,
          title: prevRow.title,
          slug: prevRow.slug
        };
      }
    }

    if (row.next_post_id) {
      const nextResult = await query(
        'SELECT id, title, slug FROM posts WHERE id = $1 AND status = $2',
        [row.next_post_id, 'published']
      );
      if (nextResult.rows.length > 0) {
        const nextRow = nextResult.rows[0];
        nextPost = {
          id: nextRow.id,
          title: nextRow.title,
          slug: nextRow.slug
        };
      }
    }

    return { prevPost, nextPost };
  }

  /**
   * Supabase模式下获取前后文章
   */
  private static async getAdjacentPostsSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<{
    prevPost: Pick<Post, 'id' | 'title' | 'slug'> | null;
    nextPost: Pick<Post, 'id' | 'title' | 'slug'> | null;
  }> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 获取当前文章的前后文章ID
    const { data: currentPost, error: currentError } = await supabase
      .from('posts')
      .select('prev_post_id, next_post_id')
      .eq('id', id)
      .single();

    if (currentError) {
      throw new Error(`Supabase select current post error: ${currentError.message}`);
    }

    if (!currentPost) {
      return { prevPost: null, nextPost: null };
    }

    let prevPost = null;
    let nextPost = null;

    // 获取上一篇文章
    if (currentPost.prev_post_id) {
      const { data: prevData, error: prevError } = await supabase
        .from('posts')
        .select('id, title, slug')
        .eq('id', currentPost.prev_post_id)
        .eq('status', 'published')
        .single();

      if (!prevError && prevData) {
        prevPost = {
          id: prevData.id,
          title: prevData.title,
          slug: prevData.slug
        };
      }
    }

    // 获取下一篇文章
    if (currentPost.next_post_id) {
      const { data: nextData, error: nextError } = await supabase
        .from('posts')
        .select('id, title, slug')
        .eq('id', currentPost.next_post_id)
        .eq('status', 'published')
        .single();

      if (!nextError && nextData) {
        nextPost = {
          id: nextData.id,
          title: nextData.title,
          slug: nextData.slug
        };
      }
    }

    return { prevPost, nextPost };
  }

  /**
   * 获取热门文章
   */
  static async getPopularPosts(limit: number = 5, request?: NextRequest, response?: NextResponse): Promise<Omit<Post, 'content'>[]> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getPopularPostsSupabase(limit, request, response);
    }

    const result = await query(
      `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.views DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      imageUrl: row.image_url || '',
      views: row.views,
      authorName: row.author_name,
      publishedAt: row.published_at,
      tags: [],
    }));
  }

  /**
   * Supabase模式下获取热门文章
   */
  private static async getPopularPostsSupabase(limit: number = 5, request?: NextRequest, response?: NextResponse): Promise<Omit<Post, 'content'>[]> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        image_url,
        views,
        published_at,
        users:author_id (username)
      `)
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      imageUrl: post.image_url || '',
      views: post.views,
      authorName: post.users?.username || '',
      publishedAt: post.published_at,
      tags: [],
    }));
  }

  /**
   * 搜索文章
   */
  static async searchPosts(queryString: string, options: {
    page?: number;
    limit?: number;
    request?: NextRequest;
    response?: NextResponse;
  } = {}): Promise<PaginationResult<Omit<Post, 'content'>>> {
    const { page = 1, limit = 10, request, response } = options;

    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.searchPostsSupabase(queryString, { page, limit, request, response });
    }

    const offset = (page - 1) * limit;

    const result = await query(
      `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags,
        -- 计算相关性分数
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
      `,
      [queryString, limit, offset]
    );

    // 获取总数
    const countResult = await query(
      `
      SELECT COUNT(*)
      FROM posts p
      WHERE p.status = 'published'
        AND to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '') || ' ' || COALESCE(p.content, ''))
            @@ plainto_tsquery('english', $1)
      `,
      [queryString]
    );

    const total = parseInt(countResult.rows[0].count);

    const posts = result.rows.map(row => ({
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
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Supabase模式下搜索文章
   */
  private static async searchPostsSupabase(queryString: string, options: {
    page?: number;
    limit?: number;
    request?: NextRequest;
    response?: NextResponse;
  }): Promise<PaginationResult<Omit<Post, 'content'>>> {
    const { page = 1, limit = 10, request, response } = options;
    const { offset } = this.buildPaginationParams(page, limit);

    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 在Supabase中使用简单的文本搜索，因为不支持PostgreSQL的全文搜索函数
    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        image_url,
        views,
        published_at,
        users:author_id (username),
        post_tags (
          tags (
            name
          )
        )
      `)
      .eq('status', 'published')
      .or(`title.ilike.%${queryString}%,excerpt.ilike.%${queryString}%,content.ilike.%${queryString}%`)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    // 获取总数
    let countQuery = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .or(`title.ilike.%${queryString}%,excerpt.ilike.%${queryString}%,content.ilike.%${queryString}%`);

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Supabase count query error: ${countError.message}`);
    }

    const total = count || 0;

    const posts = (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      imageUrl: post.image_url || '',
      views: post.views,
      authorName: post.users?.username || '',
      publishedAt: post.published_at,
      tags: post.post_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [],
    }));

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}