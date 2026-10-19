/**
 * 数据库兼容层 - 通过 TypeORM DataSource 提供 query/getClient 接口
 * 供尚未迁移到 Repository 模式的 API 路由使用
 */
import 'reflect-metadata';
import { initializeDatabase } from './datasource';

interface QueryResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
  rowCount: number;
}

export function toQueryResult(result: { records?: unknown[]; affected?: number | null }): QueryResult {
  const rows = Array.isArray(result.records) ? result.records : [];
  return {
    rows,
    rowCount: typeof result.affected === 'number' ? result.affected : rows.length,
  };
}

/**
 * 执行 SQL 查询（兼容旧接口）
 * 返回 { rows, rowCount } 以兼容 pg 驱动的结果格式
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const ds = await initializeDatabase();
  const runner = ds.createQueryRunner();
  try {
    return toQueryResult(await runner.query(text, params, true));
  } finally {
    await runner.release();
  }
}

/**
 * 获取数据库客户端（用于事务）
 * 返回一个具有 query/release 方法的对象
 */
export async function getClient() {
  const ds = await initializeDatabase();
  const queryRunner = ds.createQueryRunner();
  await queryRunner.connect();

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async query(text: string, params?: any[]): Promise<QueryResult> {
      return toQueryResult(await queryRunner.query(text, params, true));
    },
    async release() {
      await queryRunner.release();
    },
  };
}

export default { query, getClient };
