# 多数据库支持配置指南

本项目现在支持多种数据库：

1. PostgreSQL (默认，包括 Supabase)
2. MySQL (需要安装额外依赖)
3. SQLite (需要安装额外依赖)

## PostgreSQL 配置 (默认，也是 Supabase 兼容的)

### 环境变量：
```
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://username:password@localhost:5432/blog_db
```

### 使用现有 schema:
```bash
psql -d your_database_url -f db/schema.sql
```

## MySQL 配置

### 环境变量：
```
DATABASE_TYPE=mysql
DATABASE_URL=mysql://username:password@localhost:3306/blog_db
```

### 依赖项：
需要安装 `mysql2` 包:
```bash
npm install mysql2
```

### 模式说明：
使用 `db/schema-multidb.sql` 文件并根据 MySQL 要求进行调整。

## SQLite 配置

### 环境变量：
```
DATABASE_TYPE=sqlite
DATABASE_URL=sqlite://./database.sqlite
```

### 依赖项：
需要安装 `sqlite3` 和 `sqlite` 包:
```bash
npm install sqlite3 sqlite
```

### 模式说明：
使用 `db/schema-multidb.sql` 文件。

## Supabase 配置

Supabase 使用专门的客户端库进行连接，而不是直接使用数据库连接字符串。

### 环境变量：
```
DATABASE_TYPE=supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 配置步骤：

1. 在 Supabase 仪表板中获取项目 URL 和 anon key
2. 将 DATABASE_TYPE 设置为 "supabase"
3. 设置 NEXT_PUBLIC_SUPABASE_URL 为你的 Supabase 项目 URL
4. 设置 NEXT_PUBLIC_SUPABASE_ANON_KEY 为你的 Supabase anon key

### 注意事项：

- Supabase 使用 `@supabase/ssr` 库来处理服务器端渲染和 cookie 管理
- 使用 Supabase 时，数据库操作需要通过 Supabase 客户端方法而不是原始 SQL 查询
- 请确保在使用 Supabase 时，相关的数据表已经在 Supabase 项目中创建
- Supabase 客户端会自动处理身份验证和会话管理

## 当前实现状态

1. PostgreSQL 支持：✅ 完全支持
2. MySQL 支持：✅ 完全支持（依赖已安装）
3. SQLite 支持：✅ 完全支持（依赖已安装）
4. Supabase 支持：✅ 完全支持（使用专用客户端）

## 安装依赖

MySQL 和 SQLite 的依赖已经安装。如果需要重新安装或在其他环境中安装：

```bash
# MySQL 支持
npm install mysql2

# SQLite 支持
npm install sqlite3 sqlite
```

安装依赖后，相应的数据库适配器将自动启用。