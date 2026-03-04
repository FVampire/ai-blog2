# 快速启动指南

## 前提条件

- Node.js 16+ 已安装
- PostgreSQL 12+ 已安装并运行
- 已创建数据库 `blog_db`

## 步骤 1: 安装依赖

```bash
npm install pg bcryptjs jsonwebtoken
npm install --save-dev @types/pg @types/bcryptjs @types/jsonwebtoken
```

## 步骤 2: 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接：

```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/blog_db
JWT_SECRET=change-this-to-a-random-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## 步骤 3: 初始化数据库

### 方法 1: 使用 psql 命令行

```bash
# 创建数据库表结构
psql -U your_username -d blog_db -f db/schema.sql

# 导入示例数据
psql -U your_username -d blog_db -f db/seed-data.sql
```

### 方法 2: 使用 pgAdmin

1. 打开 pgAdmin
2. 连接到你的 PostgreSQL 服务器
3. 选择 `blog_db` 数据库
4. 打开 Query Tool
5. 依次执行 `db/schema.sql` 和 `db/seed-data.sql` 的内容

## 步骤 4: 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

## 步骤 5: 测试

### 前台博客

访问: http://localhost:3000

你应该能看到：
- 8篇已发布的博客文章
- 每页显示4篇文章
- 分页功能
- 侧边栏（搜索、标签云、作者简介）

### 后台管理系统

1. 访问登录页: http://localhost:3000/admin/login
2. 使用默认管理员账号:
   - 用户名: `admin`
   - 密码: `admin123`
3. 登录后访问:
   - 仪表盘: http://localhost:3000/admin
   - 文章管理: http://localhost:3000/admin/posts
   - 用户管理: http://localhost:3000/admin/users

## 验证数据库

### 检查文章数量

```bash
psql -U your_username -d blog_db -c "SELECT COUNT(*) FROM posts;"
```

应该返回 10 条记录

### 检查已发布文章

```bash
psql -U your_username -d blog_db -c "SELECT title, status FROM posts ORDER BY published_at DESC;"
```

应该看到 8 篇 published 状态和 2 篇 draft 状态的文章

### 检查标签关联

```bash
psql -U your_username -d blog_db -c "SELECT p.title, t.name FROM posts p JOIN post_tags pt ON p.id = pt.post_id JOIN tags t ON pt.tag_id = t.id ORDER BY p.title;"
```

应该看到文章和标签的关联关系

## 常见问题

### 问题 1: 数据库连接失败

**错误**: `Connection refused` 或 `ECONNREFUSED`

**解决**:
- 确认 PostgreSQL 服务正在运行
- 检查 `.env` 文件中的数据库连接字符串
- 确认数据库用户名、密码和数据库名称正确

### 问题 2: 表已存在错误

**错误**: `relation "xxx" already exists`

**解决**:
```bash
# 删除所有表重新创建
psql -U your_username -d blog_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 重新执行迁移
psql -U your_username -d blog_db -f db/schema.sql
psql -U your_username -d blog_db -f db/seed-data.sql
```

### 问题 3: JWT 认证失败

**错误**: `无效或过期的令牌`

**解决**:
- 清除浏览器 localStorage
- 重新登录
- 确认 JWT_SECRET 在 .env 文件中正确配置

### 问题 4: 前台没有显示文章

**原因**: 可能数据库中没有已发布的文章

**解决**:
```bash
# 检查文章状态
psql -U your_username -d blog_db -c "SELECT id, title, status FROM posts;"

# 如果需要，手动更新文章为已发布状态
psql -U your_username -d blog_db -c "UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE status = 'draft';"
```

## 下一步

- 查看 `README-BACKEND.md` 了解完整的API文档
- 查看 `INSTALL-DEPENDENCIES.md` 了解依赖说明
- 探索后台管理系统的各项功能
- 尝试创建、编辑和删除文章
- 自定义博客样式和布局

## 生产部署建议

在部署到生产环境前：

1. 更改 JWT_SECRET 为强随机字符串
2. 设置 NODE_ENV=production
3. 使用环境变量管理敏感信息
4. 启用 SSL/TLS 连接
5. 配置备份策略
6. 设置监控和日志
7. 实施速率限制
8. 添加 CSRF 保护

祝你使用愉快！🎉
