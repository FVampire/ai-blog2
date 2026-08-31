'use client';

import React, { useState, useEffect } from 'react';

import Link from 'next/link';

import AdminLayout from '../../../components/admin/AdminLayout';

interface Comment {
  id: number; post_id: number; post_title: string; post_slug: string;
  visitor_id: string; ip_address: string; content: string;
  status: 'pending' | 'approved' | 'rejected'; created_at: string; updated_at: string;
}
interface Pagination { total: number; page: number; limit: number; totalPages: number; }

export default function CommentsManagement() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { loadComments(); }, [statusFilter, currentPage]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments?status=${statusFilter}&page=${currentPage}&limit=20`);
      const data = await response.json();
      if (data.success) { setComments(data.data); setPagination(data.pagination); }
      else showMessage('error', data.message || '加载评论失败');
    } catch (error) { console.error('Load comments error:', error); showMessage('error', '加载评论失败'); }
    finally { setLoading(false); }
  };

  const updateCommentStatus = async (id: number, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) { showMessage('success', data.message || '状态更新成功'); loadComments(); }
      else showMessage('error', data.message || '更新失败');
    } catch (error) { console.error('Update comment error:', error); showMessage('error', '更新失败'); }
  };

  const deleteComment = async (id: number) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      const response = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) { showMessage('success', data.message || '删除成功'); loadComments(); }
      else showMessage('error', data.message || '删除失败');
    } catch (error) { console.error('Delete comment error:', error); showMessage('error', '删除失败'); }
  };

  const showMessage = (type: 'success' | 'error', text: string) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 3000); };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const truncateVisitorId = (id: string) => id.length > 12 ? `${id.substring(0, 12)}...` : id;
  const getStatusBadgeClass = (status: string) => `status-badge ${status === 'pending' ? 'status-pending' : status === 'approved' ? 'status-approved' : status === 'rejected' ? 'status-rejected' : ''}`;
  const getStatusText = (status: string) => status === 'pending' ? '待审核' : status === 'approved' ? '已批准' : status === 'rejected' ? '已拒绝' : status;

  return (
    <AdminLayout>
      <div className="admin-comments">
        <div className="admin-header"><h1>评论管理</h1><div className="stats"><span>共 {pagination.total} 条评论</span></div></div>
        {message && (<div className={`alert alert-${message.type}`}>{message.text}</div>)}
        <div className="filter-tabs">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}>
              {s === 'all' ? '全部' : s === 'pending' ? '待审核' : s === 'approved' ? '已批准' : '已拒绝'}
            </button>
          ))}
        </div>
        <div className="comments-table-container">
          {loading ? (<div className="loading-state">加载中...</div>) : comments.length === 0 ? (<div className="empty-state">暂无评论</div>) : (
            <table className="comments-table">
              <thead><tr><th>ID</th><th>文章</th><th>访客ID</th><th>IP地址</th><th>评论内容</th><th>状态</th><th>提交时间</th><th>操作</th></tr></thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id}>
                    <td>{comment.id}</td>
                    <td>{comment.post_title ? (<Link href={`/posts/${comment.post_slug}`} className="post-link" target="_blank">{comment.post_title}</Link>) : (<span className="text-muted">未知文章</span>)}</td>
                    <td><span className="visitor-id" title={comment.visitor_id}>{truncateVisitorId(comment.visitor_id)}</span></td>
                    <td>{comment.ip_address}</td>
                    <td><div className="comment-content-preview">{comment.content.length > 100 ? `${comment.content.substring(0, 100)}...` : comment.content}</div></td>
                    <td><span className={getStatusBadgeClass(comment.status)}>{getStatusText(comment.status)}</span></td>
                    <td>{formatDate(comment.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        {comment.status !== 'approved' && (<button className="btn-action btn-approve" onClick={() => updateCommentStatus(comment.id, 'approved')} title="批准">✓</button>)}
                        {comment.status !== 'rejected' && (<button className="btn-action btn-reject" onClick={() => updateCommentStatus(comment.id, 'rejected')} title="拒绝">✗</button>)}
                        {comment.status !== 'pending' && (<button className="btn-action btn-pending" onClick={() => updateCommentStatus(comment.id, 'pending')} title="待审核">⟳</button>)}
                        <button className="btn-action btn-delete" onClick={() => deleteComment(comment.id)} title="删除">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="pagination-btn" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>上一页</button>
            <span className="pagination-info">第 {currentPage} / {pagination.totalPages} 页</span>
            <button className="pagination-btn" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === pagination.totalPages}>下一页</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
