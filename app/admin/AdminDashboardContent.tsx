'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from '../../components/admin/Toast';

interface DashboardStats {
  totalPosts: number;
  totalUsers: number;
  totalComments: number;
  todayViews: number;
}

interface RecentPost {
  id: number;
  title: string;
  author: string;
  date: string;
  status: string;
}

interface AdminDashboardContentProps {
  stats: DashboardStats;
  recentPosts: RecentPost[];
}

export default function AdminDashboardContent({ stats, recentPosts }: AdminDashboardContentProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [visiblePosts, setVisiblePosts] = useState(recentPosts);

  const statCards = [
    { label: '总文章数', value: stats.totalPosts.toString(), icon: '📝', color: 'blue', link: '/admin/posts' },
    { label: '总用户数', value: stats.totalUsers.toString(), icon: '👥', color: 'green', link: '/admin/users' },
    { label: '总评论数', value: stats.totalComments.toString(), icon: '💬', color: 'orange', link: null },
    { label: '总浏览量', value: stats.todayViews.toString(), icon: '📈', color: 'purple', link: '/admin/posts' },
  ];

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'published': '已发布',
      'draft': '草稿',
      'archived': '已归档'
    };
    return statusMap[status] || status;
  };

  const handleStatClick = (link: string | null) => {
    if (link) router.push(link);
  };

  const handleEdit = (postId: number) => {
    router.push(`/admin/posts/edit/${postId}`);
  };

  const handlePreview = (postId: number) => {
    window.open(`/admin/posts/preview/${postId}`, '_blank');
  };

  const handlePublish = async (postId: number) => {
    if (!confirm('确定要发布这篇文章吗？')) return;
    setPublishingId(postId);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      const data = await response.json();
      if (data.success) {
        setVisiblePosts((posts) => posts.map((post) => post.id === postId ? { ...post, status: 'published' } : post));
        toast.success('文章发布成功');
      } else {
        toast.error(data.message || '发布失败');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('发布失败');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？此操作无法撤销。')) return;
    setDeletingId(postId);
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setVisiblePosts((posts) => posts.filter((post) => post.id !== postId));
        toast.success('文章删除成功');
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleNewPost = () => router.push('/admin/posts/new');
  const handleAddUser = () => router.push('/admin/users');
  const handleManageTags = () => router.push('/admin/tags');
  const handleViewReports = () => {
    const rows = [
      ['指标', '数值'],
      ['总文章数', stats.totalPosts],
      ['总用户数', stats.totalUsers],
      ['总评论数', stats.totalComments],
      ['总浏览量', stats.todayViews],
    ];
    const csv = `\uFEFF${rows.map((row) => row.join(',')).join('\n')}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `blog-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('统计报告已导出');
  };

  return (
    <AdminLayout>
      <div className="dashboard">
        <h1 className="page-title">仪表盘</h1>

        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <div
              key={index}
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
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">最近文章</h2>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>作者</th>
                  <th>日期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {visiblePosts.length > 0 ? (
                  visiblePosts.map((post) => (
                    <tr key={post.id}>
                      <td className="post-title">{post.title}</td>
                      <td>{post.author}</td>
                      <td>{post.date}</td>
                      <td>
                        <span className={`status-badge ${post.status === 'published' ? 'published' : 'draft'}`}>
                          {getStatusLabel(post.status)}
                        </span>
                      </td>
                      <td>
                        <button className="action-btn view" onClick={() => handlePreview(post.id)}>预览</button>
                        <button className="action-btn edit" onClick={() => handleEdit(post.id)}>编辑</button>
                        {post.status === 'draft' && (
                          <button className="action-btn enable" onClick={() => handlePublish(post.id)} disabled={publishingId === post.id}>
                            {publishingId === post.id ? '发布中...' : '发布'}
                          </button>
                        )}
                        <button className="action-btn delete" onClick={() => handleDelete(post.id)} disabled={deletingId === post.id}>
                          {deletingId === post.id ? '删除中...' : '删除'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>暂无文章</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">快速操作</h2>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={handleNewPost}>
              <span className="action-icon">➕</span><span className="action-text">新建文章</span>
            </button>
            <button className="quick-action-btn" onClick={handleAddUser}>
              <span className="action-icon">👤</span><span className="action-text">添加用户</span>
            </button>
            <button className="quick-action-btn" onClick={handleManageTags}>
              <span className="action-icon">🏷️</span><span className="action-text">管理标签</span>
            </button>
            <button className="quick-action-btn" onClick={handleViewReports}>
              <span className="action-icon">📊</span><span className="action-text">查看报告</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
