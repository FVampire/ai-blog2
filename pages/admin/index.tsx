import React, { useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { query } from '../../lib/db';

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

interface AdminDashboardProps {
  stats: DashboardStats;
  recentPosts: RecentPost[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, recentPosts }) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);

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

  // 统计卡片点击
  const handleStatClick = (link: string | null) => {
    if (link) {
      router.push(link);
    }
  };

  // 编辑文章
  const handleEdit = (postId: number) => {
    router.push(`/admin/posts/edit/${postId}`);
  };

  // 预览文章
  const handlePreview = (postId: number) => {
    window.open(`/admin/posts/preview/${postId}`, '_blank');
  };

  // 发布文章
  const handlePublish = async (postId: number) => {
    if (!confirm('确定要发布这篇文章吗？')) {
      return;
    }

    setPublishingId(postId);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'published' }),
      });

      const data = await response.json();

      if (data.success) {
        alert('文章发布成功');
        router.reload();
      } else {
        alert(data.message || '发布失败');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('发布失败');
    } finally {
      setPublishingId(null);
    }
  };

  // 删除文章
  const handleDelete = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？此操作无法撤销。')) {
      return;
    }

    setDeletingId(postId);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('文章删除成功');
        // 刷新页面
        router.reload();
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

  // 快速操作按钮处理
  const handleNewPost = () => {
    router.push('/admin/posts/new');
  };

  const handleAddUser = () => {
    router.push('/admin/users');
  };

  const handleManageTags = () => {
    router.push('/admin/tags');
  };

  const handleViewReports = () => {
    // 可以跳转到报告页面，或者显示一个模态框
    alert('报告功能开发中...\n\n统计数据：\n' +
      `- 总文章数: ${stats.totalPosts}\n` +
      `- 总用户数: ${stats.totalUsers}\n` +
      `- 总评论数: ${stats.totalComments}\n` +
      `- 总浏览量: ${stats.todayViews}`
    );
  };

  return (
    <AdminLayout>
      <Head>
        <title>仪表盘 - Blog Admin</title>
      </Head>

      <div className="dashboard">
        <h1 className="page-title">仪表盘</h1>

        {/* 统计卡片 */}
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

        {/* 最近文章 */}
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
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
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
                        <button
                          className="action-btn view"
                          onClick={() => handlePreview(post.id)}
                        >
                          预览
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(post.id)}
                        >
                          编辑
                        </button>
                        {post.status === 'draft' && (
                          <button
                            className="action-btn enable"
                            onClick={() => handlePublish(post.id)}
                            disabled={publishingId === post.id}
                          >
                            {publishingId === post.id ? '发布中...' : '发布'}
                          </button>
                        )}
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                        >
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

        {/* 快速操作 */}
        <div className="dashboard-section">
          <h2 className="section-title">快速操作</h2>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={handleNewPost}>
              <span className="action-icon">➕</span>
              <span className="action-text">新建文章</span>
            </button>
            <button className="quick-action-btn" onClick={handleAddUser}>
              <span className="action-icon">👤</span>
              <span className="action-text">添加用户</span>
            </button>
            <button className="quick-action-btn" onClick={handleManageTags}>
              <span className="action-icon">🏷️</span>
              <span className="action-text">管理标签</span>
            </button>
            <button className="quick-action-btn" onClick={handleViewReports}>
              <span className="action-icon">📊</span>
              <span className="action-text">查看报告</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    console.log('🔵 [Admin Dashboard] Fetching dashboard data...');

    // 获取统计数据
    const postsCountResult = await query('SELECT COUNT(*) as count FROM posts');
    const usersCountResult = await query('SELECT COUNT(*) as count FROM users');
    const commentsCountResult = await query('SELECT COUNT(*) as count FROM comments');
    const viewsResult = await query('SELECT COALESCE(SUM(views), 0) as total_views FROM posts');

    const stats: DashboardStats = {
      totalPosts: parseInt(postsCountResult.rows[0].count),
      totalUsers: parseInt(usersCountResult.rows[0].count),
      totalComments: parseInt(commentsCountResult.rows[0].count),
      todayViews: parseInt(viewsResult.rows[0].total_views),
    };

    // 获取最近5篇文章
    const recentPostsResult = await query(
      `
      SELECT
        p.id, p.title, p.status, p.created_at,
        u.username as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
      `
    );

    const recentPosts: RecentPost[] = recentPostsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      author: row.author_name || 'Unknown',
      date: new Date(row.created_at).toLocaleDateString('zh-CN'),
      status: row.status,
    }));

    console.log(`✅ [Admin Dashboard] Stats:`, stats);
    console.log(`✅ [Admin Dashboard] Found ${recentPosts.length} recent posts`);

    return {
      props: {
        stats,
        recentPosts,
      },
    };
  } catch (error) {
    console.error('❌ [Admin Dashboard] Error fetching data:', error);

    // 返回空数据
    return {
      props: {
        stats: {
          totalPosts: 0,
          totalUsers: 0,
          totalComments: 0,
          todayViews: 0,
        },
        recentPosts: [],
      },
    };
  }
};

export default AdminDashboard;
