import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Comment } from './entities/Comment';
import { MCPServer } from './entities/MCPServer';
import { Post } from './entities/Post';
import { PostCategory } from './entities/PostCategory';
import { PostTag } from './entities/PostTag';
import { PostVector } from './entities/PostVector';
import { Project } from './entities/Project';
import { Setting } from './entities/Setting';
import { Tag } from './entities/Tag';
import { User } from './entities/User';
import { getDatabaseSsl, sanitizeDatabaseUrl } from './pg-config';

let dataSource: DataSource | null = null;

export function getDataSource(): DataSource {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const DATABASE_URL = process.env.DATABASE_URL || '';

  dataSource = new DataSource({
    type: 'postgres',
    url: sanitizeDatabaseUrl(DATABASE_URL),
    ssl: getDatabaseSsl(),
    entities: [User, Post, Tag, PostTag, Comment, Setting, MCPServer, PostVector, Project, PostCategory],
    synchronize: false, // 生产环境不要自动同步，使用迁移
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    extra: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
  });

  return dataSource;
}

export async function initializeDatabase(): Promise<DataSource> {
  const ds = getDataSource();
  if (!ds.isInitialized) {
    await ds.initialize();
    console.log('✅ TypeORM DataSource initialized');
  }
  return ds;
}
