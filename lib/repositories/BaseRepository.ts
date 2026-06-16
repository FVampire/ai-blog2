import { initializeDatabase } from '../datasource';
import { DataSource, Repository, ObjectLiteral } from 'typeorm';

/**
 * Repository 基类
 * 提供 TypeORM DataSource 和 Repository 的访问方法
 */
export abstract class BaseRepository {
  /**
   * 获取 TypeORM DataSource（已初始化）
   */
  protected static async getDataSource(): Promise<DataSource> {
    return await initializeDatabase();
  }

  /**
   * 获取指定实体的 TypeORM Repository
   */
  protected static async getRepo<T extends ObjectLiteral>(entity: new () => T): Promise<Repository<T>> {
    const ds = await this.getDataSource();
    return ds.getRepository(entity);
  }
}
