'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import AdminLayout from '../../../components/admin/AdminLayout';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { authJson } from '../../../components/admin/authFetch';
import { toast } from '../../../components/admin/Toast';

interface Comment { id: number; post_id: number; post_title: string; post_slug: string; visitor_id: string; ip_address: string; content: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; }
interface Pagination { total: number; page: number; limit: number; totalPages: number; }

export default function CommentsManagement() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(['all', 'pending', 'approved', 'rejected'].includes(initialStatus || '') ? initialStatus! : 'pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deleting, setDeleting] = useState<Comment | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const loadComments = async () => {
    setLoading(true);
    const query = new URLSearchParams({ status: statusFilter, page: String(currentPage), limit: '20' });
    if (appliedSearch) query.set('search', appliedSearch);
    const result = await authJson<Comment[]>(`/api/comments?${query}`);
    if (result.success) {
      setComments(result.data || []);
      setPagination((result.pagination as Pagination) || { total: 0, page: 1, limit: 20, totalPages: 0 });
      setSelectedIds([]);
    } else toast.error(result.message || '加载评论失败');
    setLoading(false);
  };
  useEffect(() => { void loadComments(); }, [statusFilter, currentPage, appliedSearch]);

  const updateStatus = async (ids: number[], status: Comment['status']) => {
    setBulkBusy(true);
    const result = ids.length === 1
      ? await authJson(`/api/comments/${ids[0]}`, { method: 'PUT', body: JSON.stringify({ status }) })
      : await authJson('/api/comments', { method: 'POST', body: JSON.stringify({ ids, status }) });
    setBulkBusy(false);
    if (result.success) { toast.success(result.message || '审核状态已更新'); await loadComments(); }
    else toast.error(result.message || '操作失败');
  };

  const deleteComment = async () => {
    if (!deleting) return;
    const result = await authJson(`/api/comments/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    if (result.success) { toast.success('评论已删除'); await loadComments(); } else toast.error(result.message || '删除失败');
  };

  const selectAll = comments.length > 0 && selectedIds.length === comments.length;
  const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const statusLabel = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };

  return (
    <AdminLayout>
      <div className="admin-comments moderation-page">
        <div className="page-header"><div><p className="page-eyebrow">审核队列</p><h1 className="page-title">评论</h1><p className="page-description">待审核优先；访客 ID 与 IP 收进详情，不干扰日常判断。</p></div><span className="queue-total">当前 {pagination.total} 条</span></div>

        <div className="moderation-toolbar">
          <div className="filter-tabs" role="tablist" aria-label="评论状态">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => <button role="tab" aria-selected={statusFilter === status} key={status} className={`filter-tab ${statusFilter === status ? 'active' : ''}`} onClick={() => { setStatusFilter(status); setCurrentPage(1); }}>{status === 'all' ? '全部' : statusLabel[status]}</button>)}
          </div>
          <form className="comment-search" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(search.trim()); setCurrentPage(1); }}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="按文章标题搜索" aria-label="按文章标题搜索评论" />
            <button className="btn-secondary">搜索</button>
          </form>
        </div>

        {selectedIds.length > 0 && <div className="bulk-review-bar"><strong>已选 {selectedIds.length} 条</strong><button className="btn-review approve" disabled={bulkBusy} onClick={() => updateStatus(selectedIds, 'approved')}>批量通过</button><button className="btn-review reject" disabled={bulkBusy} onClick={() => updateStatus(selectedIds, 'rejected')}>批量拒绝</button><button className="text-button" onClick={() => setSelectedIds([])}>取消选择</button></div>}

        <div className="review-queue">
          <label className="queue-select-all"><input type="checkbox" checked={selectAll} onChange={(event) => setSelectedIds(event.target.checked ? comments.map((comment) => comment.id) : [])} />选择本页全部</label>
          {loading ? <div className="compact-empty">加载中...</div> : comments.length === 0 ? <div className="compact-empty"><strong>这个队列已经清空</strong><span>{appliedSearch ? '没有匹配文章的评论。' : '暂时没有需要处理的评论。'}</span></div> : comments.map((comment) => (
            <article className={`review-card review-${comment.status}`} key={comment.id}>
              <input className="review-checkbox" type="checkbox" aria-label={`选择评论 ${comment.id}`} checked={selectedIds.includes(comment.id)} onChange={(event) => setSelectedIds((ids) => event.target.checked ? [...ids, comment.id] : ids.filter((id) => id !== comment.id))} />
              <div className="review-body">
                <div className="review-meta"><Link href={`/posts/${comment.post_slug}`} target="_blank">{comment.post_title || '未知文章'}</Link><span>{formatDate(comment.created_at)}</span><span className={`status-badge status-${comment.status}`}>{statusLabel[comment.status]}</span></div>
                <p>{comment.content}</p>
                <details><summary>访客信息</summary><span>访客 ID：{comment.visitor_id || '—'} · IP：{comment.ip_address || '—'}</span></details>
              </div>
              <div className="review-actions">
                {comment.status !== 'approved' && <button className="btn-review approve" disabled={bulkBusy} onClick={() => updateStatus([comment.id], 'approved')}>通过</button>}
                {comment.status !== 'rejected' && <button className="btn-review reject" disabled={bulkBusy} onClick={() => updateStatus([comment.id], 'rejected')}>拒绝</button>}
                <button className="text-button danger" onClick={() => setDeleting(comment)}>删除</button>
              </div>
            </article>
          ))}
        </div>

        {pagination.totalPages > 1 && <div className="pagination"><button className="pagination-btn" onClick={() => setCurrentPage((page) => page - 1)} disabled={currentPage === 1}>上一页</button><span className="pagination-info">第 {currentPage} / {pagination.totalPages} 页</span><button className="pagination-btn" onClick={() => setCurrentPage((page) => page + 1)} disabled={currentPage >= pagination.totalPages}>下一页</button></div>}
      </div>
      <ConfirmDialog open={Boolean(deleting)} title="删除这条评论？" description="删除后无法恢复；如果只是暂时不展示，建议改为拒绝。" confirmLabel="删除评论" dangerous onConfirm={deleteComment} onCancel={() => setDeleting(null)} />
    </AdminLayout>
  );
}
