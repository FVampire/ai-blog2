# Pencil Blog - 全功能博客平台

一个使用 Next.js、TypeScript 和 PostgreSQL 构建的完整、可投入生产的博客平台。具有现代化管理仪表板、Markdown 编辑器、图片管理、标签系统和浏览量追踪功能。

![博客仪表板](./public/screenshots/dashboard.png)

## 🌟 核心功能

### 🔧 管理面板
- 基于 JWT 的安全认证
- 基于角色的访问控制（管理员/编辑者/作者）
- 内容统计仪表板
- 用户管理及状态控制

### 📝 内容管理
- 功能完整的 Markdown 编辑器，支持实时预览
- 草稿/发布/归档文章工作流
- 标签管理系统及文章关联
- SEO 友好的 URL 别名
- 特色图片上传

### 🖼️ 媒体管理
- 拖拽式图片上传
- 带缩略图预览的媒体库
- 文件验证和大小限制
- 直接文件系统存储

### 📊 数据统计与追踪
- 自动浏览量计数（防重复）
- 文章热度指标
- 内容表现概览

### 🎨 设计系统
- 响应式布局，适配所有设备
- 现代化界面，带渐变装饰
- 一致的组件库
- 管理后台支持暗色模式

### 🛠️ 技术特性
- 多数据库支持（PostgreSQL、MySQL、SQLite）
- 基于环境变量的配置
- API 路由保护
- 服务端渲染优化 SEO
- TypeScript 类型安全

## 🚀 快速开始

### 环境要求
- Node.js 16+
- PostgreSQL（或 MySQL/SQLite）
- pnpm（推荐）或 npm

### 安装步骤

1. **克隆仓库**
```bash
git clone <repository-url>
cd pencil-blog
```

2. **安装依赖**
```bash
pnpm install
```

3. **环境配置**
在根目录创建 `.env.local` 文件：
```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/blog_db
# 或其他数据库：
# DATABASE_URL=mysql://user:password@localhost:3306/blog_db
# DATABASE_URL=sqlite:///./db.sqlite

# JWT 密钥（使用强随机字符串）
JWT_SECRET=your-super-secret-jwt-key

# 可选：Supabase（如使用）
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **数据库设置**
```bash
# 创建数据库
createdb blog_db

# 执行初始化脚本
psql -d blog_db -f db/schema.sql
```

5. **运行开发服务器**
```bash
pnab dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看前端，访问 [http://localhost:3000/admin](http://localhost:3000/admin) 进入管理后台。

### 默认管理员账户
- **用户名**: admin
- **密码**: admin123

> ⚠️ 首次登录后请立即更改默认密码

## 🏗️ 项目结构

```
pencil-blog/
├── components/          # 可复用的 React 组件
│   ├── admin/           # 管理后台专用组件
│   ├── BlogPostCard.tsx # 文章展示组件
│   ├── MarkdownEditor.tsx # 富文本编辑器
│   └── ImageUpload.tsx  # 文件上传组件
├── pages/               # Next.js 页面和 API 路由
│   ├── api/             # 后端 API 端点
│   ├── admin/           # 管理后台页面
│   ├── posts/           # 博客文章页面
│   └── index.tsx        # 首页
├── lib/                 # 工具函数和客户端
├── db/                  # 数据库结构和迁移脚本
├── styles/              # 全局 CSS 和设计变量
└── public/              # 静态资源和上传文件
```

## 🗄️ 数据库结构

平台使用规范化的关联数据库结构：

### 核心表
- **users**: 用户账户，包含角色和认证信息
- **posts**: 博客文章，包含内容、状态和元数据
- **tags**: 内容分类系统
- **post_tags**: 文章和标签的多对多关系
- **comments**: 读者反馈（可选功能）

### 关键关系
- 用户可以创作多篇文章（1:N）
- 文章可以拥有多个标签（N:M）
- 文章可以收到评论（1:N）

## 🔌 API 端点

### 认证
- `POST /api/auth/login` - 用户认证
- `POST /api/auth/logout` - 会话终止

### 文章
- `GET /api/posts` - 列出公开文章（支持分页）
- `POST /api/posts` - 创建新文章（仅限管理员）
- `GET /api/posts/[id]` - 获取指定文章
- `PUT /api/posts/[id]` - 更新文章（仅限管理员）
- `DELETE /api/posts/[id]` - 删除文章（仅限管理员）
- `POST /api/posts/track-view` - 增加浏览计数

### 标签
- `GET /api/tags` - 列出所有标签及使用次数
- `POST /api/tags` - 创建新标签（仅限管理员）
- `PUT /api/tags/[id]` - 更新标签（仅限管理员）
- `DELETE /api/tags/[id]` - 删除标签（仅限管理员）

### 媒体
- `POST /api/upload` - 上传图片文件（仅限管理员）
- `GET /api/media/list` - 列出已上传媒体（仅限管理员）
- `DELETE /api/media/delete` - 删除媒体文件（仅限管理员）

## 🎨 设计与样式

### 技术栈
- **Tailwind CSS** v4 - 实用优先的 CSS 框架
- **CSS Variables** - 设计变量系统，确保主题一致性
- **Google Fonts** - Instrument Serif（标题）和 Inter（正文）

### 色彩方案
设计采用双色调色板方法：
- **科技调色板**: 青色、紫色和粉色用于文章元素
- **暖色调色板**: 珊瑚色、橙色和桃色用于标签和侧边栏

### 字体排版
- **标题**: Instrument Serif，斜体化以营造编辑感
- **正文**: Inter，清晰易读
- **代码块**: 等宽字体，带语法高亮

## 🚢 部署

### Vercel（推荐）
[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/new/clone)

### 手动部署
```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

### 生产环境变量
```env
# 数据库连接
DATABASE_URL=your-production-database-url

# 安全设置
JWT_SECRET=your-production-jwt-secret

# 可选功能
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🛡️ 安全特性

- 使用 bcrypt 进行密码哈希（10+ 轮）
- 带过期时间的 JWT 令牌认证
- 通过参数化查询防止 SQL 注入
- 通过 React 自动转义防止 XSS
- 文件上传验证和清理
- 管理功能的基于角色的访问控制

## 🧪 开发

### 可用脚本
- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm lint` - 运行代码质量检查

### 推荐的 VS Code 扩展
- **ESLint** - JavaScript/TypeScript 代码检查
- **Prettier** - 代码格式化
- **Tailwind CSS IntelliSense** - CSS 类名提示

## 🤝 贡献

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

该项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [PostgreSQL](https://www.postgresql.org/) - 开源数据库
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js) - 密码哈希
- [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown 渲染