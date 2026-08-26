'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import AdminLayout from '../../../components/admin/AdminLayout';

interface Post {
  id: string;
  title: string;
  author: string;
  date: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  tags: string[];
}

export default function AdminPostsContent({ posts, totalPosts }: { posts: Post[]; totalPosts: number }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handlePreview = (id: string) => window.open(`/admin/posts/preview/${id}`, '_blank');

  const handlePublish = async (id: string) => {
    if (!confirm('确定要发布这篇文章吗？')) return;
    setPublishingId(id);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'published' }),
      });
      const data = await response.json();
      if (data.success) { alert('文章发布成功'); window.location.reload(); }
      else { alert(data.message || '发布失败'); }
    } catch (error) { console.error('Publish error:', error); alert('发布失败'); }
    finally { setPublishingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) { alert('删除成功'); window.location.reload(); }
      else alert('删除失败');
    } catch (error) { console.error('Error deleting post:', error); alert('删除失败'); }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = { 'published': '已发布', 'draft': '草稿', 'archived': '已归档' };
    return statusMap[status] || status;
  };

  return (
    <AdminLayout>
      <div className="posts-page">
        <div className="page-header">
          <h1 className="page-title">文章管理</h1>
          <button className="btn-primary" onClick={() => router.push('/admin/posts/new')}>
            <span>➕</span> 新建文章
          </button>
        </div>

        <div className="filters">
          <div className="search-box-admin">
            <span className="search-icon-admin">🔍</span>
            <input type="text" placeholder="搜索文章标题或作者..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="search-input-admin" />
          </div>
          <div className="filter-group">
            <label>状态筛选：</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="filter-select">
              <option value="all">全部</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>标题</th><th>作者</th><th>发布日期</th>
                <th>浏览量</th><th>状态</th><th>标签</th><th style={{ width: '150px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td className="post-title">{post.title}</td>
                  <td>{post.author}</td>
                  <td>{post.date}</td>
                  <td>{post.views}</td>
                  <td><span className={`status-badge ${post.status === 'published' ? 'published' : 'draft'}`}>{getStatusLabel(post.status)}</span></td>
                  <td>
                    <div className="tags-cell">
                      {post.tags.slice(0, 2).map((tag, idx) => (<span key={idx} className="mini-tag">{tag}</span>))}
                      {post.tags.length > 2 && <span className="mini-tag">+{post.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    <button className="action-btn view" onClick={() => handlePreview(post.id)}>预览</button>
                    <button className="action-btn edit" onClick={() => router.push(`/admin/posts/edit/${post.id}`)}>编辑</button>
                    {post.status === 'draft' && (
                      <button className="action-btn enable" onClick={() => handlePublish(post.id)} disabled={publishingId === post.id}>
                        {publishingId === post.id ? '发布中...' : '发布'}
                      </button>
                    )}
                    <button className="action-btn delete" onClick={() => handleDelete(post.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPosts.length === 0 && (<div className="empty-state"><p>没有找到匹配的文章</p></div>)}
        </div>

        <div className="pagination-admin">
          <button className="pagination-btn-admin">上一页</button>
          <span className="pagination-info">显示 {filteredPosts.length} / {totalPosts} 篇文章</span>
          <button className="pagination-btn-admin">下一页</button>
        </div>
      </div>
    </AdminLayout>
  );
}
