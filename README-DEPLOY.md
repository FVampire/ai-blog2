# ai-blog2 部署与使用指南

本地开发验证 → Git Hook + PM2 服务器自动部署 → Agent 一键发博客

## 一、本地开发（先验证）

### 1. 环境要求

- Node.js 20+
- pnpm
- PostgreSQL 14+（本地或远程）

### 2. 启动步骤

```bash
cd ai-blog2
pnpm install
cp .env.example .env
```

编辑 `.env`：

```env
DATABASE_URL=postgresql://用户名:密码@localhost:5432/blog_db
JWT_SECRET=随便写一个长字符串
AGENT_API_KEY=你的agent密钥
SITE_URL=http://localhost:3000
```

初始化数据库（首次）：

```bash
# 方式 A：用 psql 执行 schema（全新库）
psql -U postgres -d blog_db -f db/schema.sql

# 方式 B：只跑增量迁移（schema 已存在时）
pnpm migrate
```

启动：

```bash
pnpm dev
```

访问：
- 前台：http://localhost:3000
- 管理后台：http://localhost:3000/admin/login（默认 `admin` / `admin123`）
- 项目管理：http://localhost:3000/admin/projects
- 项目展示：http://localhost:3000/projects

### 3. Agent 发博客（本地）

```bash
curl -X POST http://localhost:3000/api/agent/publish \
  -H "Authorization: Bearer 你的AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"测试文章\",\"content\":\"# Hello\n\nAgent 发布\",\"status\":\"published\"}"
```

在 Cursor 中说「发一篇博客」也会触发 `.cursor/skills/publish-blog` skill。

### 4. 挂载项目成果

**后台配置：** 管理后台 → 项目管理 → 新建项目（名称、描述、技术栈、仓库链接、关联文章）

**Agent API：**

```bash
# 注册项目
curl -X POST http://localhost:3000/api/agent/projects \
  -H "Authorization: Bearer 你的AGENT_API_KEY" \
  -d "{\"name\":\"short-novel\",\"description\":\"AI短篇小说\",\"techStack\":[\"Python\"]}"
```

发博客时带上 `projectSlug` 即可自动关联。

**展示配置：** 管理后台 → 系统设置 → 项目展示（首页是否显示、数量、导航名称等）

---

## 二、服务器部署（Git Hook + PM2）

不使用 Docker。推送代码后服务器自动拉取、构建、PM2 重启。

### 架构

```
本地 git push → 服务器 bare 仓库 → post-receive hook → deploy.sh → PM2 restart
```

### 1. 服务器首次配置

在 Linux 服务器上（项目目录内）：

```bash
bash scripts/server-setup.sh /var/www/ai-blog2 /var/repos/ai-blog2.git master
```

这会创建：
- Bare 仓库：`/var/repos/ai-blog2.git`
- 部署目录：`/var/www/ai-blog2`
- `post-receive` hook

### 2. 服务器环境配置

```bash
cd /var/www/ai-blog2
cp .env.example .env
# 编辑 .env：DATABASE_URL、JWT_SECRET、AGENT_API_KEY、SITE_URL 等

bash scripts/deploy.sh master
```

`deploy.sh` 会：安装依赖 → 迁移 → `pnpm build` → `pm2 restart`。

PM2 配置见 `ecosystem.config.js`，进程名 `blog`。

### 3. 本地添加 remote 并推送

```bash
git remote add production ssh://user@your-server/var/repos/ai-blog2.git
git push production master
```

推送后服务器自动部署，日志：`/var/www/ai-blog2/deploy.log`

### 4. 常用 PM2 命令

```bash
pm2 status
pm2 logs blog
pm2 restart blog
pm2 save
```

### 5. Gitee Webhook（可选替代方案）

如果不用 bare 仓库 hook，可在 Gitee 配置 Webhook：

- URL：`https://你的域名/api/deploy/webhook`
- Header：`Authorization: Bearer <DEPLOY_SECRET>`
- 需在 `.env` 设置 `DEPLOY_SECRET`

---

## 三、API 速查

| 端点 | 认证 | 说明 |
|------|------|------|
| `POST /api/agent/publish` | AGENT_API_KEY | 发布博客 |
| `POST /api/agent/upload` | AGENT_API_KEY | 上传图片 |
| `GET/POST /api/agent/projects` | AGENT_API_KEY | 项目管理 |
| `GET/POST /api/admin/projects` | JWT | 后台项目管理 |
| `POST /api/deploy/webhook` | DEPLOY_SECRET | 触发部署 |
| `GET /api/projects` | 无 | 公开项目列表 |

---

## 四、验证清单

- [ ] 本地 `pnpm dev` 能打开首页
- [ ] 管理后台能登录，项目管理 CRUD 正常
- [ ] `/projects` 页面展示正常
- [ ] Agent API 能发布文章
- [ ] 服务器 push 后 PM2 自动重启
- [ ] 线上 Agent 发博客正常
