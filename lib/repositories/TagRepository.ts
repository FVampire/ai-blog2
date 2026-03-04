import { query, createDatabaseAdapter } from '../db';
import { BaseRepository } from './BaseRepository';
import { NextRequest, NextResponse } from 'next/server';

interface Tag {
  id: number;
  name: string;
  slug: string;
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

export class TagRepository extends BaseRepository {
  /**
   * 获取所有标签
   */
  static async getAllTags(request?: NextRequest, response?: NextResponse): Promise<Tag[]> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getAllTagsSupabase(request, response);
    }

    const result = await query(
      `
      SELECT id, name, slug, created_at, updated_at
      FROM tags
      ORDER BY name ASC
      `
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Supabase模式下获取所有标签
   */
  private static async getAllTagsSupabase(request?: NextRequest, response?: NextResponse): Promise<Tag[]> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('tags')
      .select('id, name, slug, created_at, updated_at')
      .order('name, { ascending: true }');

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return (data || []).map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at,
    }));
  }

  /**
   * 分页获取标签
   */
  static async getTags(options: {
    page?: number;
    limit?: number;
    search?: string;
    request?: NextRequest;
    response?: NextResponse;
  } = {}): Promise<PaginationResult<Tag>> {
    const { page = 1, limit = 10, search, request, response } = options;

    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getTagsSupabase({ page, limit, search, request, response });
    }

    const offset = (page - 1) * limit;

    // 构建查询
    let queryText = `
      SELECT id, name, slug, created_at, updated_at
      FROM tags
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // 添加搜索条件
    if (search) {
      queryText += ` AND (name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryText += `
      ORDER BY name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    // 执行查询
    const result = await query(queryText, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM tags WHERE 1=1';
    const countParams: any[] = [];

    if (search) {
      countQuery += ` AND (name ILIKE $1 OR slug ILIKE $1)`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // 格式化响应
    const tags = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      data: tags,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Supabase模式下分页获取标签
   */
  private static async getTagsSupabase(options: {
    page?: number;
    limit?: number;
    search?: string;
    request?: NextRequest;
    response?: NextResponse;
  }): Promise<PaginationResult<Tag>> {
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
      .from('tags')
      .select('id, name, slug, created_at, updated_at')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    // 添加搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    // 获取总数
    let countQuery = supabase
      .from('tags')
      .select('*', { count: 'exact', head: true });

    // 添加搜索条件到计数查询
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Supabase count query error: ${countError.message}`);
    }

    const total = count || 0;

    // 格式化响应
    const tags = (data || []).map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at,
    }));

    return {
      data: tags,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 通过ID获取标签
   */
  static async getTagById(id: number, request?: NextRequest, response?: NextResponse): Promise<Tag | null> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getTagByIdSupabase(id, request, response);
    }

    const result = await query(
      `
      SELECT id, name, slug, created_at, updated_at
      FROM tags
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下通过ID获取标签
   */
  private static async getTagByIdSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<Tag | null> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('tags')
      .select('id, name, slug, created_at, updated_at')
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
      name: data.name,
      slug: data.slug,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * 通过slug获取标签
   */
  static async getTagBySlug(slug: string, request?: NextRequest, response?: NextResponse): Promise<Tag | null> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getTagBySlugSupabase(slug, request, response);
    }

    const result = await query(
      `
      SELECT id, name, slug, created_at, updated_at
      FROM tags
      WHERE slug = $1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下通过slug获取标签
   */
  private static async getTagBySlugSupabase(slug: string, request?: NextRequest, response?: NextResponse): Promise<Tag | null> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('tags')
      .select('id, name, slug, created_at, updated_at')
      .eq('slug', slug)
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
      name: data.name,
      slug: data.slug,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * 创建标签
   */
  static async createTag(data: {
    name: string;
    slug: string;
  }, request?: NextRequest, response?: NextResponse): Promise<Tag> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.createTagSupabase(data, request, response);
    }

    // 检查标签是否已存在
    const existCheck = await query('SELECT id FROM tags WHERE slug = $1 OR name = $2', [data.slug, data.name]);
    if (existCheck.rows.length > 0) {
      throw new Error('标签名称或slug已存在');
    }

    const result = await query(
      `
      INSERT INTO tags (name, slug)
      VALUES ($1, $2)
      RETURNING id, name, slug, created_at, updated_at
      `,
      [data.name, data.slug]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下创建标签
   */
  private static async createTagSupabase(data: {
    name: string;
    slug: string;
  }, request?: NextRequest, response?: NextResponse): Promise<Tag> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 检查标签是否已存在
    const { data: existingTag, error: checkError } = await supabase
      .from('tags')
      .select('id')
      .or(`slug.eq.${data.slug},name.eq.${data.name}`)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Supabase check error: ${checkError.message}`);
    }

    if (existingTag) {
      throw new Error('标签名称或slug已存在');
    }

    const tagData = {
      name: data.name,
      slug: data.slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newTag, error: insertError } = await supabase
      .from('tags')
      .insert([tagData])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Supabase insert error: ${insertError.message}`);
    }

    return {
      id: newTag.id,
      name: newTag.name,
      slug: newTag.slug,
      createdAt: newTag.created_at,
      updatedAt: newTag.updated_at,
    };
  }

  /**
   * 更新标签
   */
  static async updateTag(id: number, data: {
    name?: string;
    slug?: string;
  }, request?: NextRequest, response?: NextResponse): Promise<Tag> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.updateTagSupabase(id, data, request, response);
    }

    // 构建动态更新 SQL
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(data.name);
      paramIndex++;
    }

    if (data.slug !== undefined) {
      updateFields.push(`slug = $${paramIndex}`);
      updateValues.push(data.slug);
      paramIndex++;
    }

    // 如果没有任何字段需要更新
    if (updateFields.length === 0) {
      // 获取当前标签信息
      const currentTag = await this.getTagById(id);
      if (!currentTag) {
        throw new Error('标签不存在');
      }
      return currentTag;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id); // 最后一个参数是 ID

    const updateQuery = `
      UPDATE tags
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, slug, created_at, updated_at
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      throw new Error('标签不存在');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下更新标签
   */
  private static async updateTagSupabase(id: number, data: {
    name?: string;
    slug?: string;
  }, request?: NextRequest, response?: NextResponse): Promise<Tag> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 检查标签是否存在
    const { data: existingTag, error: checkError } = await supabase
      .from('tags')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Supabase check error: ${checkError.message}`);
    }

    if (!existingTag) {
      throw new Error('标签不存在');
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // 只更新传入的字段（区分 undefined 和空值）
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.slug !== undefined) {
      updateData.slug = data.slug;
    }

    // 更新标签
    const { data: updatedTag, error: updateError } = await supabase
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Supabase update error: ${updateError.message}`);
    }

    return {
      id: updatedTag.id,
      name: updatedTag.name,
      slug: updatedTag.slug,
      createdAt: updatedTag.created_at,
      updatedAt: updatedTag.updated_at,
    };
  }

  /**
   * 删除标签
   */
  static async deleteTag(id: number, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.deleteTagSupabase(id, request, response);
    }

    // 先删除关联的文章标签
    await query('DELETE FROM post_tags WHERE tag_id = $1', [id]);

    // 再删除标签
    const result = await query('DELETE FROM tags WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Supabase模式下删除标签
   */
  private static async deleteTagSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 先删除关联的文章标签
    const { error: deletePostTagsError } = await supabase
      .from('post_tags')
      .delete()
      .eq('tag_id', id);

    if (deletePostTagsError) {
      throw new Error(`Supabase delete post_tags error: ${deletePostTagsError.message}`);
    }

    // 再删除标签
    const { error: deleteTagError } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (deleteTagError) {
      throw new Error(`Supabase delete tag error: ${deleteTagError.message}`);
    }

    // 如果没有错误，说明删除成功
    return true;
  }

  /**
   * 获取标签关联的文章数量
   */
  static async getTagPostCount(tagId: number, request?: NextRequest, response?: NextResponse): Promise<number> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getTagPostCountSupabase(tagId, request, response);
    }

    const result = await query(
      'SELECT COUNT(*) FROM post_tags WHERE tag_id = $1',
      [tagId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Supabase模式下获取标签关联的文章数量
   */
  private static async getTagPostCountSupabase(tagId: number, request?: NextRequest, response?: NextResponse): Promise<number> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { count, error } = await supabase
      .from('post_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tagId);

    if (error) {
      throw new Error(`Supabase count error: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * 获取热门标签
   */
  static async getPopularTags(limit: number = 10, request?: NextRequest, response?: NextResponse): Promise<Tag[]> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getPopularTagsSupabase(limit, request, response);
    }

    const result = await query(
      `
      SELECT t.id, t.name, t.slug, t.created_at, t.updated_at
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY COUNT(pt.post_id) DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Supabase模式下获取热门标签
   */
  private static async getPopularTagsSupabase(limit: number = 10, request?: NextRequest, response?: NextResponse): Promise<Tag[]> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Supabase不直接支持JOIN和GROUP BY的复杂查询，我们需要分步处理
    // 首先获取所有标签
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('id, name, slug, created_at, updated_at');

    if (tagsError) {
      throw new Error(`Supabase get tags error: ${tagsError.message}`);
    }

    // 然后获取每个标签的文章计数
    const tagCounts: { [key: number]: number } = {};

    // 为了性能，我们批量处理
    const batchSize = 100;
    for (let i = 0; i < tags.length; i += batchSize) {
      const batch = tags.slice(i, i + batchSize);
      const tagIds = batch.map(tag => tag.id);

      const { count, error: countError } = await supabase
        .from('post_tags')
        .select('*', { count: 'exact', head: true })
        .in('tag_id', tagIds);

      if (countError) {
        throw new Error(`Supabase count error: ${countError.message}`);
      }

      // 分别获取每个标签的计数
      for (const tag of batch) {
        const { count: tagCount, error: tagCountError } = await supabase
          .from('post_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);

        if (tagCountError) {
          throw new Error(`Supabase tag count error: ${tagCountError.message}`);
        }

        tagCounts[tag.id] = tagCount || 0;
      }
    }

    // 根据文章数量排序标签
    const sortedTags = [...tags].sort((a, b) => {
      const countA = tagCounts[a.id] || 0;
      const countB = tagCounts[b.id] || 0;
      return countB - countA;
    });

    // 限制返回数量
    const limitedTags = sortedTags.slice(0, limit);

    // 格式化返回结果
    return limitedTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at,
    }));
  }
}