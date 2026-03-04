import { query, getClient, createDatabaseAdapter } from '../db';
import { NextRequest, NextResponse } from 'next/server';

// 数据库类型枚举
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'supabase';

// Repository基类
export abstract class BaseRepository {
  protected static databaseType: DatabaseType = (process.env.DATABASE_TYPE?.toLowerCase() as DatabaseType) || 'postgresql';

  /**
   * 获取当前数据库类型
   */
  protected static getDatabaseType(): DatabaseType {
    return this.databaseType;
  }

  /**
   * 检查是否为Supabase模式
   */
  protected static isSupabase(): boolean {
    return this.databaseType === 'supabase';
  }

  /**
   * 为Supabase模式创建数据库适配器
   */
  protected static async createSupabaseAdapter(request?: NextRequest, response?: NextResponse) {
    if (!this.isSupabase()) {
      throw new Error('Not in Supabase mode');
    }

    // 如果没有提供response，创建一个默认的
    const res = response || NextResponse.next();

    // 创建数据库适配器
    const dbAdapter = createDatabaseAdapter(request, res);

    return dbAdapter;
  }

  /**
   * 执行查询 - 支持所有数据库类型
   */
  protected static async executeQuery(text: string, params?: any[], request?: NextRequest, response?: NextResponse) {
    if (this.isSupabase()) {
      throw new Error('Raw SQL queries are not supported with Supabase adapter. Use the Supabase client methods directly.');
    }

    return await query(text, params);
  }

  /**
   * 获取数据库客户端 - 支持所有数据库类型
   */
  protected static async getDatabaseClient(request?: NextRequest, response?: NextResponse) {
    if (this.isSupabase()) {
      const dbAdapter = await this.createSupabaseAdapter(request, response);
      return await dbAdapter.getClient();
    }

    return await getClient();
  }

  /**
   * 处理Supabase查询结果
   */
  protected static handleSupabaseResult(result: { data: any[] | null, error: any } | null) {
    if (!result) {
      throw new Error('No result returned from Supabase query');
    }

    if (result.error) {
      throw new Error(`Supabase query error: ${result.error.message}`);
    }

    return result.data || [];
  }

  /**
   * 构建分页查询参数
   */
  protected static buildPaginationParams(page: number, limit: number): { offset: number, limit: number } {
    const offset = (page - 1) * limit;
    return { offset, limit };
  }

  /**
   * 计算分页信息
   */
  protected static calculatePagination(total: number, page: number, limit: number): {
    total: number;
    page: number;
    limit: number;
    totalPages: number
  } {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}