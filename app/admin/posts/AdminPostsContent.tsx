'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import AdminLayout from '../../../components/admin/AdminLayout';
import { authJson } from '../../../components/admin/authFetch';
import { toast } from '../../../components/admin/Toast';

interface Post {
  id: number;
  title: string;
  author: string;
  date: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  tags: string[];
}

type StatusFilter = 'all' | 'published' | 'draft' | 'archived';

interface AdminPostsContentProps {
  posts: Post[];
  totalPosts: number;
  page: number;
  pageSize: number;
  totalPages: number;
  status: StatusFilter;
  search: string;
}

export default function AdminPostsContent({
  posts,
  totalPosts,
  page,
  pageSize,
  totalPages,
  status,
  search,
}: AdminPostsContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(search);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  const buildUrl = (next: { page?: number; status?: StatusFilter; search?: string }) => {
    const query = new URLSearchParams();
    const nextPage = next.page ?? page;
    const nextStatus = next.status ?? status;
    const nextSearch = next.search ?? searchTerm;

    if (nextPage > 1) query.set('page', String(nextPage));
    if (nextStatus !== 'all') query.set('status', nextStatus);
    if (nextSearch.trim()) query.set('search', nextSearch.trim());

    const queryString = query.toString();
    return queryString ? `/admin/posts?${queryString}` : '/admin/posts';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ page: 1 }));
  };

  const handleStatusChange = (nextStatus: StatusFilter) => {
    router.push(buildUrl({ page: 1, status: nextStatus }));
  };

  const handlePreview = (id: number) => window.open(`/admin/posts/preview/${id}`, '_blank');

  const handlePublish = async (id: number) => {
    if (!confirm('确定要发布这篇文章吗？')) return;
    setPublishingId(id);
    const result = await authJson(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'published' }),
    });
    setPublishingId(null);

    if (result.success) {
      toast.success('文章发布成功');
      router.refresh();
    } else {
      toast.error(result.message || '发布失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    setDeletingId(id);
    const result = await authJson(`/api/posts/${id}`, { method: 'DELETE' });
    setDeletingId(null);

    if (result.success) {
      toast.success('删除成功');
      router.refresh();
    } else {
      toast.error(result.message || '删除失败');
    }
  };

  const getStatusLabel = (value: string) => {
    const statusMap: { [key: string]: string } = { published: '已发布', draft: '草稿', archived: '已归档' };
    return statusMap[value] || value;
  };

  const rangeStart = totalPosts === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = totalPosts === 0 ? 0 : (page - 1) * pageSize + posts.length;

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
          <form className="search-box-admin" onSubmit={handleSearchSubmit}>
            <span className="search-icon-admin">🔍</span>
            <input type="text" placeholder="搜索文章标题或作者..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="search-input-admin" />
            <button type="submit" className="search-submit-admin">搜索</button>
          </form>
          <div className="filter-group">
            <label>状态筛选：</label>
            <select value={status} onChange={(e) => handleStatusChange(e.target.value as StatusFilter)} className="filter-select">
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
              {posts.map((post) => (
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
                    <button className="action-btn delete" onClick={() => handleDelete(post.id)} disabled={deletingId === post.id}>
                      {deletingId === post.id ? '删除中...' : '删除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 && (<div className="empty-state"><p>没有找到匹配的文章</p></div>)}
        </div>

        <div className="pagination-admin">
          <button
            className="pagination-btn-admin"
            onClick={() => router.push(buildUrl({ page: page - 1 }))}
            disabled={page <= 1}
          >
            上一页
          </button>
          <span className="pagination-info">
            {totalPosts === 0
              ? '共 0 篇文章'
              : `第 ${rangeStart}-${rangeEnd} 篇 / 共 ${totalPosts} 篇（第 ${page} / ${Math.max(totalPages, 1)} 页）`}
          </span>
          <button
            className="pagination-btn-admin"
            onClick={() => router.push(buildUrl({ page: page + 1 }))}
            disabled={totalPages === 0 || page >= totalPages}
          >
            下一页
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
