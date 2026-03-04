# 文章浏览量追踪功能实现文档

## 概述
本文档详细说明了博客系统中文章浏览量（Views）追踪功能的完整实现。

## 功能特性

### 1. 自动浏览量追踪
- 当用户访问文章详情页时，系统自动记录一次浏览
- 使用前端埋点技术，在页面加载时触发追踪请求
- 追踪请求异步执行，不影响页面加载性能

### 2. 实时浏览量显示
- 文章详情页显示当前浏览次数
- 管理后台显示每篇文章的总浏览量
- 首页Dashboard统计总浏览量

## 技术实现

### 1. 数据库表结构

文章表（posts）包含 views 字段：
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  views INTEGER DEFAULT 0,  -- 浏览次数
  ...
);
```

### 2. API 端点

#### POST /api/posts/track-view

**文件位置**: `pages/api/posts/track-view.ts`

**请求体**:
```json
{
  "postId": 123
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "views": 456
  }
}
```

**实现逻辑**:
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({
      success: false,
      message: 'Post ID is required'
    });
  }

  try {
    // 更新浏览量（原子操作）
    const result = await query(
      'UPDATE posts SET views = views + 1 WHERE id = $1 RETURNING views',
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    return res.json({
      success: true,
      data: { views: result.rows[0].views }
    });
  } catch (error) {
    console.error('Track view error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

### 3. 前端埋点实现

#### 文章详情页（pages/posts/[slug].tsx）

**位置**: 第 39-59 行

```typescript
useEffect(() => {
  if (post && post.id) {
    // 调用追踪API
    fetch('/api/posts/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postId: post.id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log(`View tracked for post ${post.id}, total views: ${data.data.views}`);
        }
      })
      .catch(err => {
        console.error('Failed to track view:', err);
      });
  }
}, [post?.id]);
```

**关键点**:
- 使用 `useEffect` 钩子，确保在组件挂载时执行
- 依赖项为 `[post?.id]`，避免重复追踪
- 异步请求，不阻塞页面渲染
- 错误处理，追踪失败不影响用户体验

### 4. 浏览量显示

#### 文章详情页显示

```tsx
<div className="blog-meta">
  <span className="meta-text">{formatDate(post.published_at)}</span>
  <span className="meta-text">作者: {post.author_name}</span>
  <span className="meta-text">👁️ {post.views} 次阅读</span>
</div>
```

#### 管理后台列表显示

```tsx
// pages/admin/posts.tsx
<td>{post.views}</td>
```

#### Dashboard 统计显示

```tsx
// pages/admin/index.tsx
const statsResult = await query(`
  SELECT
    COUNT(*) as total_posts,
    SUM(views) as total_views,
    ...
  FROM posts
`);
```

## 数据流程

### 用户访问文章详情页流程

```
1. 用户访问 /posts/article-slug
   ↓
2. Next.js getServerSideProps 查询文章数据（包含当前 views）
   ↓
3. 页面渲染，显示文章内容和当前浏览量
   ↓
4. useEffect 触发，调用 track-view API
   ↓
5. 后端执行 UPDATE posts SET views = views + 1
   ↓
6. 返回更新后的浏览量
   ↓
7. 控制台输出追踪日志（可选）
```

## 优化建议

### 1. 防止重复计数
当前实现在每次页面加载时都会增加浏览量。可以考虑以下优化：

```typescript
// 使用 sessionStorage 防止同一会话重复计数
useEffect(() => {
  if (post && post.id) {
    const viewedKey = `post_viewed_${post.id}`;
    const hasViewed = sessionStorage.getItem(viewedKey);

    if (!hasViewed) {
      fetch('/api/posts/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            sessionStorage.setItem(viewedKey, 'true');
            console.log(`View tracked for post ${post.id}`);
          }
        })
        .catch(err => console.error('Failed to track view:', err));
    }
  }
}, [post?.id]);
```

### 2. IP 限制
在后端实现基于 IP 地址的限流：

```typescript
// pages/api/posts/track-view.ts
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({ tokensPerInterval: 10, interval: 'hour' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const isAllowed = await limiter.removeTokens(1);
  if (!isAllowed) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests'
    });
  }

  // ... 其余追踪逻辑
}
```

### 3. 批量追踪
对于高并发场景，可以使用 Redis 缓存临时存储浏览量，定期批量写入数据库：

```typescript
// 使用 Redis 计数器
await redis.incr(`post:${postId}:views`);

// 定时任务每分钟同步到数据库
setInterval(async () => {
  const keys = await redis.keys('post:*:views');
  for (const key of keys) {
    const postId = key.match(/post:(\d+):views/)[1];
    const views = await redis.get(key);
    await query(
      'UPDATE posts SET views = views + $1 WHERE id = $2',
      [views, postId]
    );
    await redis.del(key);
  }
}, 60000); // 每分钟同步一次
```

## 测试建议

### 1. 单元测试

```typescript
// __tests__/api/posts/track-view.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/posts/track-view';

describe('/api/posts/track-view', () => {
  it('应该增加文章浏览量', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { postId: 1 },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.views).toBeGreaterThan(0);
  });

  it('缺少 postId 应该返回 400', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
```

### 2. 集成测试

```typescript
// 测试完整流程
describe('文章浏览追踪集成测试', () => {
  it('访问文章页面应该增加浏览量', async () => {
    // 1. 获取初始浏览量
    const initialViews = await getPostViews(postId);

    // 2. 调用追踪 API
    await fetch('/api/posts/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    });

    // 3. 验证浏览量增加
    const updatedViews = await getPostViews(postId);
    expect(updatedViews).toBe(initialViews + 1);
  });
});
```

## 监控和日志

### 1. 追踪成功日志
```
✅ View tracked for post 123, total views: 456
```

### 2. 追踪失败日志
```
❌ Failed to track view: Error: Network request failed
```

### 3. 性能监控
建议监控以下指标：
- 追踪 API 响应时间
- 追踪成功率
- 数据库更新性能

## 总结

浏览量追踪功能已完整实现，包括：

✅ 后端 API 端点（/api/posts/track-view）
✅ 前端埋点（useEffect 自动追踪）
✅ 实时浏览量显示（文章详情页、管理后台）
✅ 数据库原子操作（防止并发问题）
✅ 错误处理（追踪失败不影响用户体验）

该实现满足基本的浏览量统计需求，后续可根据实际业务需求进行优化（如防重复、IP 限制、批量写入等）。
