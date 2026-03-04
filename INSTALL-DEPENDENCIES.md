# 后端依赖安装指南

## 需要安装的 npm 包

### 核心依赖

```bash
# PostgreSQL 客户端
npm install pg

# 密码加密
npm install bcryptjs

# JWT 认证
npm install jsonwebtoken

# 环境变量支持（Next.js 已内置，但确保版本兼容）
# dotenv 通常不需要单独安装，Next.js 已支持 .env 文件
```

### TypeScript 类型定义

```bash
# 安装类型定义（开发依赖）
npm install --save-dev @types/pg @types/bcryptjs @types/jsonwebtoken
```

## 一键安装命令

```bash
npm install pg bcryptjs jsonwebtoken
npm install --save-dev @types/pg @types/bcryptjs @types/jsonwebtoken
```

## 验证安装

安装完成后，你的 `package.json` 应该包含以下依赖：

```json
{
  "dependencies": {
    "pg": "^8.x.x",
    "bcryptjs": "^2.x.x",
    "jsonwebtoken": "^9.x.x"
  },
  "devDependencies": {
    "@types/pg": "^8.x.x",
    "@types/bcryptjs": "^2.x.x",
    "@types/jsonwebtoken": "^9.x.x"
  }
}
```

## 注意事项

1. **pg (PostgreSQL 客户端)**
   - 用于连接和操作 PostgreSQL 数据库
   - 提供连接池管理

2. **bcryptjs**
   - 用于密码加密和验证
   - 比 bcrypt 更易于安装（纯 JavaScript 实现）

3. **jsonwebtoken**
   - 用于生成和验证 JWT 令牌
   - 实现用户认证

## 下一步

安装完依赖后：

1. 配置 `.env` 文件（参考 `.env.example`）
2. 创建 PostgreSQL 数据库
3. 运行数据库迁移（执行 `db/schema.sql`）
4. 启动开发服务器 `npm run dev`

详细说明请参考 `README-BACKEND.md`
