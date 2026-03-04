# Dashboard 仪表盘按钮功能实现文档

## 概述
本文档详细说明了管理后台 Dashboard（仪表盘）页面中所有交互按钮的功能实现。

---

## 功能清单

### ✅ 1. 统计卡片（可点击）

**位置**: 页面顶部的 4 个统计卡片

#### 1.1 总文章数卡片
- **图标**: 📝
- **颜色**: 蓝色
- **功能**: 点击跳转到文章管理页面 (`/admin/posts`)
- **显示**: 数据库中文章总数

#### 1.2 总用户数卡片
- **图标**: 👥
- **颜色**: 绿色
- **功能**: 点击跳转到用户管理页面 (`/admin/users`)
- **显示**: 数据库中用户总数

#### 1.3 总评论数卡片
- **图标**: 💬
- **颜色**: 橙色
- **功能**: 暂不可点击（评论功能待实现）
- **显示**: 数据库中评论总数

#### 1.4 总浏览量卡片
- **图标**: 📈
- **颜色**: 紫色
- **功能**: 点击跳转到文章管理页面 (`/admin/posts`)
- **显示**: 所有文章的总浏览量

**交互效果**:
- 鼠标悬停时卡片上浮 4px
- 阴影加深
- 鼠标指针变为手型（有链接的卡片）

**实现代码**:
```typescript
const handleStatClick = (link: string | null) => {
  if (link) {
    router.push(link);
  }
};

<div
  className={`stat-card stat-${stat.color}`}
  onClick={() => handleStatClick(stat.link)}
  style={{
    cursor: stat.link ? 'pointer' : 'default',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  }}
  onMouseEnter={(e) => {
    if (stat.link) {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
    }
  }}
  onMouseLeave={(e) => {
    if (stat.link) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }
  }}
>
  {/* 卡片内容 */}
</div>
```

---

### ✅ 2. 最近文章表格操作按钮

**位置**: 最近文章表格的"操作"列

#### 2.1 编辑按钮
- **文字**: "编辑"
- **样式**: 蓝色边框按钮
- **功能**: 跳转到文章编辑页面
- **路由**: `/admin/posts/edit/[id]`
- **实现**:
```typescript
const handleEdit = (postId: number) => {
  router.push(`/admin/posts/edit/${postId}`);
};

<button
  className="action-btn edit"
  onClick={() => handleEdit(post.id)}
>
  编辑
</button>
```

#### 2.2 删除按钮
- **文字**: "删除" / "删除中..."
- **样式**: 红色边框按钮
- **功能**: 删除指定文章
- **交互流程**:
  1. 点击按钮
  2. 显示确认对话框："确定要删除这篇文章吗？此操作无法撤销。"
  3. 用户确认后，调用删除 API
  4. 显示加载状态："删除中..."
  5. 删除成功后刷新页面

- **实现**:
```typescript
const [deletingId, setDeletingId] = useState<number | null>(null);

const handleDelete = async (postId: number) => {
  // 1. 确认对话框
  if (!confirm('确定要删除这篇文章吗？此操作无法撤销。')) {
    return;
  }

  // 2. 设置加载状态
  setDeletingId(postId);

  try {
    // 3. 调用 API
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    // 4. 处理结果
    if (data.success) {
      alert('文章删除成功');
      router.reload(); // 刷新页面
    } else {
      alert(data.message || '删除失败');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('删除失败');
  } finally {
    setDeletingId(null);
  }
};

<button
  className="action-btn delete"
  onClick={() => handleDelete(post.id)}
  disabled={deletingId === post.id}
>
  {deletingId === post.id ? '删除中...' : '删除'}
</button>
```

---

### ✅ 3. 快速操作按钮

**位置**: 页面底部的"快速操作"区域

#### 3.1 新建文章
- **图标**: ➕
- **文字**: "新建文章"
- **功能**: 跳转到新建文章页面
- **路由**: `/admin/posts/new`
- **实现**:
```typescript
const handleNewPost = () => {
  router.push('/admin/posts/new');
};

<button className="quick-action-btn" onClick={handleNewPost}>
  <span className="action-icon">➕</span>
  <span className="action-text">新建文章</span>
</button>
```

#### 3.2 添加用户
- **图标**: 👤
- **文字**: "添加用户"
- **功能**: 跳转到用户管理页面
- **路由**: `/admin/users`
- **实现**:
```typescript
const handleAddUser = () => {
  router.push('/admin/users');
};

<button className="quick-action-btn" onClick={handleAddUser}>
  <span className="action-icon">👤</span>
  <span className="action-text">添加用户</span>
</button>
```

#### 3.3 管理标签
- **图标**: 🏷️
- **文字**: "管理标签"
- **功能**: 跳转到标签管理页面
- **路由**: `/admin/tags`
- **实现**:
```typescript
const handleManageTags = () => {
  router.push('/admin/tags');
};

<button className="quick-action-btn" onClick={handleManageTags}>
  <span className="action-icon">🏷️</span>
  <span className="action-text">管理标签</span>
</button>
```

#### 3.4 查看报告
- **图标**: 📊
- **文字**: "查看报告"
- **功能**: 显示统计数据摘要（当前为 Alert 弹窗）
- **显示内容**:
  - 总文章数
  - 总用户数
  - 总评论数
  - 总浏览量
- **实现**:
```typescript
const handleViewReports = () => {
  alert('报告功能开发中...\n\n统计数据：\n' +
    `- 总文章数: ${stats.totalPosts}\n` +
    `- 总用户数: ${stats.totalUsers}\n` +
    `- 总评论数: ${stats.totalComments}\n` +
    `- 总浏览量: ${stats.todayViews}`
  );
};

<button className="quick-action-btn" onClick={handleViewReports}>
  <span className="action-icon">📊</span>
  <span className="action-text">查看报告</span>
</button>
```

---

## 用户体验优化

### 1. 交互反馈
- **悬停效果**: 所有按钮鼠标悬停时改变颜色/阴影
- **加载状态**: 删除按钮显示"删除中..."防止重复点击
- **禁用状态**: 正在删除的按钮不可点击
- **确认对话框**: 删除操作需要用户确认

### 2. 视觉效果
- **统计卡片**:
  - 有链接的卡片鼠标悬停时上浮
  - 阴影加深提示可点击
  - 鼠标指针变为手型
- **快速操作按钮**:
  - 悬停时背景变为渐变色
  - 文字颜色变白
  - 按钮轻微上浮

### 3. 错误处理
- API 调用失败显示错误提示
- 删除失败不刷新页面
- 使用 try-catch 捕获异常

---

## 数据流程

### 统计卡片数据获取
```
getServerSideProps (SSR)
  ↓
查询数据库统计
  - SELECT COUNT(*) FROM posts
  - SELECT COUNT(*) FROM users
  - SELECT COUNT(*) FROM comments
  - SELECT SUM(views) FROM posts
  ↓
返回统计数据到组件
  ↓
渲染卡片
```

### 最近文章数据获取
```
getServerSideProps (SSR)
  ↓
查询最近 5 篇文章
  SELECT p.*, u.username
  FROM posts p
  LEFT JOIN users u ON p.author_id = u.id
  ORDER BY p.created_at DESC
  LIMIT 5
  ↓
格式化数据
  ↓
渲染表格
```

### 删除文章流程
```
用户点击删除按钮
  ↓
显示确认对话框
  ↓
用户确认
  ↓
设置 deletingId 状态
  ↓
调用 DELETE /api/posts/[id]
  ↓
API 执行数据库删除
  ↓
返回成功/失败
  ↓
刷新页面 / 显示错误
```

---

## 完整代码示例

```typescript
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import AdminLayout from '../../components/admin/AdminLayout';
import { query } from '../../lib/db';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, recentPosts }) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 统计卡片配置（带链接）
  const statCards = [
    { label: '总文章数', value: stats.totalPosts.toString(), icon: '📝', color: 'blue', link: '/admin/posts' },
    { label: '总用户数', value: stats.totalUsers.toString(), icon: '👥', color: 'green', link: '/admin/users' },
    { label: '总评论数', value: stats.totalComments.toString(), icon: '💬', color: 'orange', link: null },
    { label: '总浏览量', value: stats.todayViews.toString(), icon: '📈', color: 'purple', link: '/admin/posts' },
  ];

  // 统计卡片点击
  const handleStatClick = (link: string | null) => {
    if (link) router.push(link);
  };

  // 编辑文章
  const handleEdit = (postId: number) => {
    router.push(`/admin/posts/edit/${postId}`);
  };

  // 删除文章
  const handleDelete = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？此操作无法撤销。')) return;

    setDeletingId(postId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        alert('文章删除成功');
        router.reload();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  // 快速操作
  const handleNewPost = () => router.push('/admin/posts/new');
  const handleAddUser = () => router.push('/admin/users');
  const handleManageTags = () => router.push('/admin/tags');
  const handleViewReports = () => {
    alert(`报告功能开发中...\n\n统计数据：\n` +
      `- 总文章数: ${stats.totalPosts}\n` +
      `- 总用户数: ${stats.totalUsers}\n` +
      `- 总评论数: ${stats.totalComments}\n` +
      `- 总浏览量: ${stats.todayViews}`
    );
  };

  return (
    <AdminLayout>
      {/* 统计卡片 */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`stat-card stat-${stat.color}`}
            onClick={() => handleStatClick(stat.link)}
            style={{ cursor: stat.link ? 'pointer' : 'default' }}
          >
            {/* ... */}
          </div>
        ))}
      </div>

      {/* 最近文章 */}
      <table>
        <tbody>
          {recentPosts.map(post => (
            <tr key={post.id}>
              <td>{post.title}</td>
              <td>
                <button onClick={() => handleEdit(post.id)}>编辑</button>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                >
                  {deletingId === post.id ? '删除中...' : '删除'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 快速操作 */}
      <div className="quick-actions">
        <button onClick={handleNewPost}>➕ 新建文章</button>
        <button onClick={handleAddUser}>👤 添加用户</button>
        <button onClick={handleManageTags}>🏷️ 管理标签</button>
        <button onClick={handleViewReports}>📊 查看报告</button>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
```

---

## 未来优化建议

### 1. 查看报告功能增强
当前"查看报告"按钮只显示简单的 Alert 弹窗，可以优化为：

**选项 A: 独立报告页面**
```typescript
const handleViewReports = () => {
  router.push('/admin/reports');
};
```

创建 `/admin/reports` 页面，包含：
- 时间范围筛选
- 图表展示（文章发布趋势、浏览量趋势）
- 导出功能（CSV、PDF）
- 详细数据表格

**选项 B: 模态框展示**
```typescript
const [showReportModal, setShowReportModal] = useState(false);

const handleViewReports = () => {
  setShowReportModal(true);
};

<Modal show={showReportModal} onClose={() => setShowReportModal(false)}>
  <h2>统计报告</h2>
  <div className="report-stats">
    {/* 图表和数据 */}
  </div>
</Modal>
```

### 2. 删除确认优化
使用自定义模态框替代浏览器原生 `confirm`：

```typescript
const [deleteConfirm, setDeleteConfirm] = useState<{
  show: boolean;
  postId: number | null;
  postTitle: string;
}>({ show: false, postId: null, postTitle: '' });

const handleDeleteClick = (post: RecentPost) => {
  setDeleteConfirm({
    show: true,
    postId: post.id,
    postTitle: post.title,
  });
};

<ConfirmModal
  show={deleteConfirm.show}
  title="删除文章"
  message={`确定要删除文章"${deleteConfirm.postTitle}"吗？`}
  onConfirm={() => handleDelete(deleteConfirm.postId)}
  onCancel={() => setDeleteConfirm({ show: false, postId: null, postTitle: '' })}
/>
```

### 3. 批量操作
添加批量删除功能：

```typescript
const [selectedPosts, setSelectedPosts] = useState<number[]>([]);

const handleBatchDelete = async () => {
  // 批量删除逻辑
};

<button onClick={handleBatchDelete} disabled={selectedPosts.length === 0}>
  批量删除 ({selectedPosts.length})
</button>
```

### 4. 实时更新
使用 SWR 或 React Query 实现数据自动刷新：

```typescript
import useSWR from 'swr';

const { data, mutate } = useSWR('/api/dashboard/stats', fetcher, {
  refreshInterval: 30000, // 每 30 秒刷新
});
```

### 5. 操作撤销
删除后提供撤销选项（软删除）：

```typescript
const handleDelete = async (postId: number) => {
  // 软删除
  await softDeletePost(postId);

  // 显示撤销提示
  showToast('文章已删除', {
    action: {
      label: '撤销',
      onClick: () => restorePost(postId),
    },
    duration: 5000,
  });
};
```

---

## 总结

Dashboard 仪表盘页面现已实现以下完整功能：

✅ **统计卡片点击跳转**（4 个卡片）
✅ **最近文章编辑按钮**（跳转到编辑页）
✅ **最近文章删除按钮**（带确认和加载状态）
✅ **快速操作按钮**（4 个快捷入口）
  - 新建文章
  - 添加用户
  - 管理标签
  - 查看报告

所有按钮都已实现对应的功能和交互效果，提供了良好的用户体验和视觉反馈。

---

**文档版本**: v1.0
**最后更新**: 2024
**维护者**: Claude Code Assistant
