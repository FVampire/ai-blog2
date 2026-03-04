import { query, createDatabaseAdapter } from '../db';
import { BaseRepository } from './BaseRepository';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'author' | 'user';
  status: 'active' | 'inactive' | 'suspended';
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

export class UserRepository extends BaseRepository {
  /**
   * 获取所有用户
   */
  static async getAllUsers(request?: NextRequest, response?: NextResponse): Promise<User[]> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getAllUsersSupabase(request, response);
    }

    const result = await query(
      `
      SELECT id, username, email, role, status, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      `
    );

    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Supabase模式下获取所有用户
   */
  private static async getAllUsersSupabase(request?: NextRequest, response?: NextResponse): Promise<User[]> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return (data || []).map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
  }

  /**
   * 分页获取用户
   */
  static async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    request?: NextRequest;
    response?: NextResponse;
  } = {}): Promise<PaginationResult<User>> {
    const { page = 1, limit = 10, search, role, status, request, response } = options;

    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getUsersSupabase({ page, limit, search, role, status, request, response });
    }

    const offset = (page - 1) * limit;

    // 构建查询
    let queryText = `
      SELECT id, username, email, role, status, created_at, updated_at
      FROM users
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // 添加搜索条件
    if (search) {
      queryText += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 添加角色筛选
    if (role && role !== 'all') {
      queryText += ` AND role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    // 添加状态筛选
    if (status && status !== 'all') {
      queryText += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    queryText += `
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    // 执行查询
    const result = await query(queryText, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams: any[] = [];

    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (username ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (role && role !== 'all') {
      countQuery += ` AND role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    if (status && status !== 'all') {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // 格式化响应
    const users = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Supabase模式下分页获取用户
   */
  private static async getUsersSupabase(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    request?: NextRequest;
    response?: NextResponse;
  }): Promise<PaginationResult<User>> {
    const { page = 1, limit = 10, search, role, status, request, response } = options;
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
      .from('users')
      .select('id, username, email, role, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 添加搜索条件
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 添加角色筛选
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    // 添加状态筛选
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    // 获取总数
    let countQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 添加搜索条件到计数查询
    if (search) {
      countQuery = countQuery.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 添加角色筛选到计数查询
    if (role && role !== 'all') {
      countQuery = countQuery.eq('role', role);
    }

    // 添加状态筛选到计数查询
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Supabase count query error: ${countError.message}`);
    }

    const total = count || 0;

    // 格式化响应
    const users = (data || []).map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 通过ID获取用户
   */
  static async getUserById(id: number, request?: NextRequest, response?: NextResponse): Promise<User | null> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getUserByIdSupabase(id, request, response);
    }

    const result = await query(
      `
      SELECT id, username, email, role, status, created_at, updated_at
      FROM users
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
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下通过ID获取用户
   */
  private static async getUserByIdSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<User | null> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, status, created_at, updated_at')
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
      username: data.username,
      email: data.email,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * 通过用户名获取用户
   */
  static async getUserByUsername(username: string, request?: NextRequest, response?: NextResponse): Promise<User | null> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getUserByUsernameSupabase(username, request, response);
    }

    const result = await query(
      `
      SELECT id, username, email, role, status, created_at, updated_at
      FROM users
      WHERE username = $1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下通过用户名获取用户
   */
  private static async getUserByUsernameSupabase(username: string, request?: NextRequest, response?: NextResponse): Promise<User | null> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, status, created_at, updated_at')
      .eq('username', username)
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
      username: data.username,
      email: data.email,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * 通过邮箱获取用户
   */
  static async getUserByEmail(email: string, request?: NextRequest, response?: NextResponse): Promise<User | null> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getUserByEmailSupabase(email, request, response);
    }

    const result = await query(
      `
      SELECT id, username, email, role, status, created_at, updated_at
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下通过邮箱获取用户
   */
  private static async getUserByEmailSupabase(email: string, request?: NextRequest, response?: NextResponse): Promise<User | null> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, status, created_at, updated_at')
      .eq('email', email)
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
      username: data.username,
      email: data.email,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * 创建用户
   */
  static async createUser(data: {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'author' | 'user';
    status?: 'active' | 'inactive' | 'suspended';
  }, request?: NextRequest, response?: NextResponse): Promise<User> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.createUserSupabase(data, request, response);
    }

    // 检查用户名是否已存在
    const usernameCheck = await query('SELECT id FROM users WHERE username = $1', [data.username]);
    if (usernameCheck.rows.length > 0) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (emailCheck.rows.length > 0) {
      throw new Error('邮箱已被使用');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await query(
      `
      INSERT INTO users (username, email, password, role, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role, status, created_at, updated_at
      `,
      [
        data.username,
        data.email,
        hashedPassword,
        data.role || 'user',
        data.status || 'active'
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下创建用户
   */
  private static async createUserSupabase(data: {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'author' | 'user';
    status?: 'active' | 'inactive' | 'suspended';
  }, request?: NextRequest, response?: NextResponse): Promise<User> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 检查用户名是否已存在
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('username', data.username)
      .maybeSingle();

    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
      throw new Error(`Supabase username check error: ${usernameCheckError.message}`);
    }

    if (existingUsername) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .maybeSingle();

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      throw new Error(`Supabase email check error: ${emailCheckError.message}`);
    }

    if (existingEmail) {
      throw new Error('邮箱已被使用');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userData = {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'user',
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Supabase insert error: ${insertError.message}`);
    }

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
    };
  }

  /**
   * 更新用户
   */
  static async updateUser(id: number, data: {
    username?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'author' | 'user';
    status?: 'active' | 'inactive' | 'suspended';
  }, request?: NextRequest, response?: NextResponse): Promise<User> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.updateUserSupabase(id, data, request, response);
    }

    // 检查用户是否存在
    const currentUser = await this.getUserById(id);
    if (!currentUser) {
      throw new Error('用户不存在');
    }

    // 检查用户名是否已存在（其他用户）
    if (data.username) {
      const usernameCheck = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [data.username, id]
      );
      if (usernameCheck.rows.length > 0) {
        throw new Error('用户名已存在');
      }
    }

    // 检查邮箱是否已存在（其他用户）
    if (data.email) {
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [data.email, id]
      );
      if (emailCheck.rows.length > 0) {
        throw new Error('邮箱已被使用');
      }
    }

    // 构建动态更新 SQL
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.username !== undefined) {
      updateFields.push(`username = $${paramIndex}`);
      updateValues.push(data.username);
      paramIndex++;
    }

    if (data.email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      updateValues.push(data.email);
      paramIndex++;
    }

    if (data.password !== undefined) {
      // 密码加密
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateFields.push(`password = $${paramIndex}`);
      updateValues.push(hashedPassword);
      paramIndex++;
    }

    if (data.role !== undefined) {
      updateFields.push(`role = $${paramIndex}`);
      updateValues.push(data.role);
      paramIndex++;
    }

    if (data.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(data.status);
      paramIndex++;
    }

    // 如果没有任何字段需要更新
    if (updateFields.length === 0) {
      return currentUser;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id); // 最后一个参数是 ID

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, role, status, created_at, updated_at
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      throw new Error('用户不存在');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Supabase模式下更新用户
   */
  private static async updateUserSupabase(id: number, data: {
    username?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'author' | 'user';
    status?: 'active' | 'inactive' | 'suspended';
  }, request?: NextRequest, response?: NextResponse): Promise<User> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 检查用户是否存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Supabase check error: ${checkError.message}`);
    }

    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 检查用户名是否已存在（其他用户）
    if (data.username) {
      const { data: existingUsername, error: usernameCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('username', data.username)
        .neq('id', id)
        .maybeSingle();

      if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
        throw new Error(`Supabase username check error: ${usernameCheckError.message}`);
      }

      if (existingUsername) {
        throw new Error('用户名已存在');
      }
    }

    // 检查邮箱是否已存在（其他用户）
    if (data.email) {
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .neq('id', id)
        .maybeSingle();

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        throw new Error(`Supabase email check error: ${emailCheckError.message}`);
      }

      if (existingEmail) {
        throw new Error('邮箱已被使用');
      }
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // 只更新传入的字段（区分 undefined 和空值）
    if (data.username !== undefined) {
      updateData.username = data.username;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.password !== undefined) {
      // 密码加密
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    // 更新用户
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Supabase update error: ${updateError.message}`);
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    };
  }

  /**
   * 删除用户
   */
  static async deleteUser(id: number, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.deleteUserSupabase(id, request, response);
    }

    // 注意：在实际应用中，可能需要先处理关联数据
    // 例如：将用户的文章作者设为null或转移给其他用户

    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Supabase模式下删除用户
   */
  private static async deleteUserSupabase(id: number, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return true;
  }

  /**
   * 验证用户密码
   */
  static async validatePassword(username: string, password: string, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.validatePasswordSupabase(username, password, request, response);
    }

    const result = await query(
      'SELECT password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const hashedPassword = result.rows[0].password;
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Supabase模式下验证用户密码
   */
  private static async validatePasswordSupabase(username: string, password: string, request?: NextRequest, response?: NextResponse): Promise<boolean> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 在Supabase模式下，密码验证通常通过登录操作完成
    // 这里我们简单地查询用户并验证密码
    const { data: user, error } = await supabase
      .from('users')
      .select('password')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Resource not found
        return false;
      }
      throw new Error(`Supabase query error: ${error.message}`);
    }

    if (!user || !user.password) {
      return false;
    }

    return await bcrypt.compare(password, user.password);
  }

  /**
   * 获取用户文章数量
   */
  static async getUserPostCount(userId: number, request?: NextRequest, response?: NextResponse): Promise<number> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getUserPostCountSupabase(userId, request, response);
    }

    const result = await query(
      'SELECT COUNT(*) FROM posts WHERE author_id = $1',
      [userId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Supabase模式下获取用户文章数量
   */
  private static async getUserPostCountSupabase(userId: number, request?: NextRequest, response?: NextResponse): Promise<number> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId);

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * 获取用户统计数据
   */
  static async getUserStats(request?: NextRequest, response?: NextResponse): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    authorUsers: number;
  }> {
    // 如果是Supabase模式，使用Supabase特定的方法
    if (this.isSupabase()) {
      return await this.getUserStatsSupabase(request, response);
    }

    const result = await query(
      `
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
        COUNT(*) FILTER (WHERE role = 'author') as author_users
      FROM users
      `
    );

    const row = result.rows[0];
    return {
      totalUsers: parseInt(row.total_users),
      activeUsers: parseInt(row.active_users),
      adminUsers: parseInt(row.admin_users),
      authorUsers: parseInt(row.author_users),
    };
  }

  /**
   * Supabase模式下获取用户统计数据
   */
  private static async getUserStatsSupabase(request?: NextRequest, response?: NextResponse): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    authorUsers: number;
  }> {
    // 创建Supabase适配器
    const dbAdapter = await this.createSupabaseAdapter(request, response);
    const client = await dbAdapter.getClient();
    const supabase = (client as any).supabase;

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 在Supabase中分别查询各个统计数据
    const [{ count: totalUsers, error: totalError },
          { count: activeUsers, error: activeError },
          { count: adminUsers, error: adminError },
          { count: authorUsers, error: authorError }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'author')
    ]);

    if (totalError || activeError || adminError || authorError) {
      const errors = [totalError, activeError, adminError, authorError].filter(Boolean);
      throw new Error(`Supabase query error: ${errors.map(e => e?.message).join(', ')}`);
    }

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      adminUsers: adminUsers || 0,
      authorUsers: authorUsers || 0,
    };
  }
}