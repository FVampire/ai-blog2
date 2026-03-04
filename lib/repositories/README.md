# 数据访问层 (Repository Layer)

这个目录包含了所有数据库访问的封装类，提供了类型安全、易于使用的数据访问接口。

## 目录结构

```
repositories/
├── PostRepository.ts     # 文章数据访问类
├── TagRepository.ts      # 标签数据访问类
├── UserRepository.ts     # 用户数据访问类
├── CommentRepository.ts  # 评论数据访问类
├── MediaRepository.ts    # 媒体文件数据访问类
├── SettingsRepository.ts # 设置数据访问类
├── index.ts             # 导出所有类
└── README.md            # 说明文档
```

## 使用方法

### 1. 导入数据访问类

```typescript
// 导入单个类
import { PostRepository } from '../lib/repositories/PostRepository';

// 或者导入所有类
import { PostRepository, TagRepository, UserRepository } from '../lib/repositories';
```

### 2. 使用示例

#### 获取文章列表
```typescript
// 获取公开文章列表
const publicPosts = await PostRepository.getPublicPosts({
  page: 1,
  limit: 10,
  search: '技术'
});

// 获取管理员文章列表
const adminPosts = await PostRepository.getAdminPosts({
  page: 1,
  limit: 10,
  status: 'published',
  search: 'React'
});
```

#### 创建文章
```typescript
const newPost = await PostRepository.createPost({
  title: '新文章标题',
  slug: 'new-post-slug',
  content: '文章内容',
  excerpt: '文章摘要',
  status: 'draft',
  authorId: 1,
  tagIds: [1, 2, 3]
});
```

#### 更新文章
```typescript
const updatedPost = await PostRepository.updatePost(1, {
  title: '更新后的标题',
  status: 'published'
});
```

#### 获取用户信息
```typescript
const user = await UserRepository.getUserById(1);
const userPostsCount = await UserRepository.getUserPostCount(1);
```

#### 获取标签信息
```typescript
const tags = await TagRepository.getAllTags();
const popularTags = await TagRepository.getPopularTags(10);
```

#### 处理评论
```typescript
// 获取文章评论
const comments = await CommentRepository.getCommentsByPostId(1, {
  status: 'approved'
});

// 创建评论
const newComment = await CommentRepository.createComment({
  content: '这是一条评论',
  postId: 1,
  authorName: '评论者',
  status: 'pending'
});
```

#### 媒体文件操作
```typescript
// 创建媒体文件记录
const media = await MediaRepository.createMedia({
  filename: 'image.jpg',
  originalName: '图片.jpg',
  mimeType: 'image/jpeg',
  size: 102400,
  url: '/uploads/image.jpg'
});

// 获取媒体文件
const mediaFile = await MediaRepository.getMediaById(1);
```

#### 设置管理
```typescript
// 获取站点设置
const siteSettings = await SettingsRepository.getSiteSettings();

// 更新站点设置
await SettingsRepository.updateSiteSettings({
  siteName: '我的博客',
  postsPerPage: 5
});

// 获取单个设置值
const postsPerPage = await SettingsRepository.getSettingValue('posts_per_page', 10);
```

## 特性

1. **类型安全**: 所有方法都有完整的 TypeScript 类型定义
2. **分页支持**: 大部分列表查询方法都支持分页
3. **错误处理**: 统一的错误处理机制
4. **事务支持**: 需要事务的操作使用了数据库事务
5. **数据验证**: 在更新和创建数据时进行验证
6. **性能优化**: 合理使用索引和查询优化

## 注意事项

1. 所有方法都是静态方法，直接通过类名调用
2. 所有方法都是异步的，返回 Promise
3. 在使用需要事务的操作时，确保正确处理异常
4. 查询结果中的日期字段都是 Date 对象
5. 分页查询返回的数据结构包含总数、总页数等信息