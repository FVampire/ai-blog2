# 使用示例：如何将原始数据库查询替换为Repository模式

这个文档展示了如何使用新创建的数据访问层来替换现有的原始SQL查询。

## 1. 原始API实现（使用原始查询）

```typescript
// pages/api/posts/index.ts (原始实现)
import { query, getClient } from '../../../lib/db';

// 获取公开文章列表
async function publicGetHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { page = '1', limit = '10', search } = req.query;

    // 复杂的原始SQL查询
    let queryText = `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = 'published'
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // 添加搜索条件
    if (search) {
      queryText += ` AND (p.title ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY p.id, u.username
      ORDER BY p.published_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(parseInt(limit as string), offset);

    // 执行查询
    const result = await query(queryText, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM posts p WHERE p.status = $1';
    const countParams: any[] = ['published'];

    if (search) {
      countQuery += ' AND (p.title ILIKE $2 OR EXISTS(SELECT 1 FROM users u WHERE u.id = p.author_id AND u.username ILIKE $2))';
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // 格式化响应
    const posts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      // ... 其他字段映射
    }));

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}
```

## 2. 使用Repository模式的实现

```typescript
// pages/api/posts/index.ts (使用Repository模式)
import { NextApiRequest, NextApiResponse } from 'next';
import { AuthenticatedRequest, authMiddleware } from '../../../lib/auth-middleware';
import { PostRepository } from '../../../lib/repositories/PostRepository';

// 获取公开文章列表
async function publicGetHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { page = '1', limit = '10', search } = req.query;

    // 使用Repository模式，代码更简洁
    const result = await PostRepository.getPublicPosts({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string
    });

    return res.status(200).json({
      success: true,
      data: result.data.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        image: post.imageUrl || '',
        author: post.authorName,
        date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '',
        tags: post.tags,
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 获取管理员文章列表
async function adminGetHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '10', status, search } = req.query;

      // 使用Repository模式
      const result = await PostRepository.getAdminPosts({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        search: search as string
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get posts error:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
      });
    }
  }

  // 创建文章
  if (req.method === 'POST') {
    try {
      const { title, slug, excerpt, content, imageUrl, status, tagIds } = req.body;
      const authorId = req.user?.userId;

      if (!title || !slug) {
        return res.status(400).json({
          success: false,
          message: '标题和slug不能为空',
        });
      }

      if (!authorId) {
        return res.status(401).json({
          success: false,
          message: '未授权',
        });
      }

      // 使用Repository模式创建文章
      const newPost = await PostRepository.createPost({
        title,
        slug,
        excerpt,
        content,
        imageUrl,
        status: status || 'draft',
        authorId,
        tagIds
      });

      return res.status(201).json({
        success: true,
        message: '文章创建成功',
        data: {
          post: newPost,
        },
      });
    } catch (error) {
      console.error('Create post error:', error);
      return res.status(500).json({
        success: false,
        message: '创建文章失败',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: '方法不允许',
  });
}
```

## 3. 前端使用示例

```typescript
// pages/admin/posts.tsx (前端使用示例)
import React, { useState, useEffect } from 'react';
import { PostRepository } from '../lib/repositories/PostRepository';

const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchPosts();
  }, [pagination.page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // 使用Repository模式获取文章列表
      const result = await PostRepository.getAdminPosts({
        page: pagination.page,
        limit: pagination.limit
      });

      setPosts(result.data);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      });
    } catch (error) {
      console.error('获取文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这篇文章吗？')) {
      try {
        // 使用Repository模式删除文章
        const success = await PostRepository.deletePost(id);
        if (success) {
          alert('删除成功');
          fetchPosts(); // 重新加载数据
        } else {
          alert('删除失败');
        }
      } catch (error) {
        console.error('删除文章失败:', error);
        alert('删除失败');
      }
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1>文章管理</h1>
      <table>
        <thead>
          <tr>
            <th>标题</th>
            <th>作者</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id}>
              <td>{post.title}</td>
              <td>{post.authorName}</td>
              <td>{post.status}</td>
              <td>
                <button onClick={() => handleDelete(post.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button
          disabled={pagination.page <= 1}
          onClick={() => setPagination({...pagination, page: pagination.page - 1})}
        >
          上一页
        </button>
        <span>{pagination.page} / {pagination.totalPages}</span>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => set-pagination({...pagination, page: pagination.page + 1})}
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default AdminPosts;
```

## 4. 优势对比

### 使用原始查询的问题：
1. **重复代码**：每个API路由都需要写类似的SQL查询逻辑
2. **难以维护**：SQL查询分散在各个文件中，修改时需要查找多个地方
3. **类型不安全**：没有明确的类型定义，容易出错
4. **缺乏抽象**：业务逻辑和数据访问逻辑混合在一起

### 使用Repository模式的优势：
1. **代码复用**：所有数据访问逻辑集中在Repository类中
2. **易于维护**：修改数据库查询只需要修改对应的Repository方法
3. **类型安全**：完整的TypeScript类型定义
4. **关注点分离**：API路由只关注HTTP请求处理，数据访问交给Repository
5. **测试友好**：可以单独测试Repository方法
6. **一致性**：所有数据访问遵循相同的模式和标准

## 5. 迁移步骤

1. **引入Repository**：在需要的文件中导入对应的Repository类
2. **替换查询逻辑**：将原始的`query()`调用替换为Repository方法调用
3. **调整数据格式**：根据Repository返回的数据结构调整前端代码
4. **测试验证**：确保替换后功能正常，性能没有明显下降
5. **逐步迁移**：可以逐个API路由进行迁移，避免一次性大规模改动

通过使用Repository模式，我们可以显著提高代码的可维护性、可读性和可测试性。