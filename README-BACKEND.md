# Blog System with Admin Panel

## 技术栈

- **Frontend**: Next.js 13+, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Styling**: CSS Modules

## 环境配置

### 1. 安装依赖

```bash
npm install
```

### 2. 安装额外的后端依赖

```bash
npm install pg bcryptjs jsonwebtoken
npm install --save-dev @types/pg @types/bcryptjs @types/jsonwebtoken
```

### 3. 配置数据库

复制 `.env.example` 到 `.env`:

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的PostgreSQL数据库连接：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/blog_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3000
```

### 4. 创建数据库

```bash
# 连接到PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE blog_db;

# 退出psql
\q
```

### 5. 运行数据库迁移

```bash
# 执行schema.sql文件创建表结构
psql -U username -d blog_db -f db/schema.sql

# 导入mock数据（可选，用于测试）
psql -U username -d blog_db -f db/seed-data.sql
```

或者使用pgAdmin等工具执行 `db/schema.sql` 和 `db/seed-data.sql` 文件。

**Mock数据说明**：
- `seed-data.sql` 包含10篇示例博客文章
- 其中8篇为已发布状态，2篇为草稿状态
- 所有文章都关联到默认的admin用户
- 文章包含图片、标签和完整内容
- 已发布的文章会显示在前台博客列表中

## 运行项目

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm start
```

## 后台管理系统

### 访问地址

- **登录页面**: http://localhost:3000/admin/login
- **后台首页**: http://localhost:3000/admin

### 默认管理员账号

- **用户名**: admin
- **密码**: admin123

## API接口

### 认证 API

#### POST /api/auth/login
登录接口

**请求体**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

#### GET /api/auth/me
获取当前用户信息（需要认证）

**请求头**:
```
Authorization: Bearer <token>
```

### 文章 API

#### GET /api/posts
获取文章列表

**查询参数**:
- `page`: 页码（默认: 1）
- `limit`: 每页数量（默认: 10）
- `status`: 文章状态（draft | published | archived）
- `search`: 搜索关键词

#### GET /api/posts/[id]
获取单篇文章（需要认证）

#### PUT /api/posts/[id]
更新文章（需要认证）

#### DELETE /api/posts/[id]
删除文章（需要认证）

### 用户 API（仅管理员）

#### GET /api/users
获取用户列表

**查询参数**:
- `page`: 页码
- `limit`: 每页数量
- `search`: 搜索关键词
- `role`: 角色筛选
- `status`: 状态筛选

#### GET /api/users/[id]
获取单个用户信息

#### PUT /api/users/[id]
更新用户信息

#### DELETE /api/users/[id]
删除用户

## 数据库结构

### 表格说明

- **users**: 用户表
- **posts**: 文章表
- **tags**: 标签表
- **post_tags**: 文章-标签关联表
- **comments**: 评论表

详细结构请参考 `db/schema.sql`

## 项目结构

```
.
├── components/           # React组件
│   ├── admin/           # 后台管理组件
│   ├── Header.tsx       # 前台Header
│   ├── Footer.tsx       # 前台Footer
│   └── ...
├── pages/               # 页面和API路由
│   ├── admin/          # 后台管理页面
│   │   ├── login.tsx   # 登录页
│   │   ├── index.tsx   # 仪表盘
│   │   ├── posts.tsx   # 文章管理
│   │   └── users.tsx   # 用户管理
│   ├── api/            # API路由
│   │   ├── auth/       # 认证API
│   │   ├── posts/      # 文章API
│   │   └── users/      # 用户API
│   └── index.tsx       # 前台首页
├── lib/                # 工具库
│   ├── db.ts          # 数据库连接
│   ├── jwt.ts         # JWT工具
│   └── auth-middleware.ts  # 认证中间件
├── db/                 # 数据库相关
│   └── schema.sql     # 数据库架构
├── styles/            # 样式文件
│   └── globals.css    # 全局样式
└── .env.example       # 环境变量示例
```

## 安全建议

1. **生产环境**:
   - 更改 `JWT_SECRET` 为强随机字符串
   - 设置 `NODE_ENV=production`
   - 使用 SSL 连接数据库
   - 启用 HTTPS

2. **密码策略**:
   - 强制使用强密码
   - 定期更换密码
   - 实施账号锁定机制

3. **API安全**:
   - 实施速率限制
   - 添加CSRF保护
   - 使用CORS配置

## 开发建议

- 使用 TypeScript 保证类型安全
- 遵循 RESTful API 设计原则
- 编写单元测试和集成测试
- 使用 Git 进行版本控制

## License

MIT
