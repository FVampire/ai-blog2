'use client';

import React, { useCallback, useEffect, useState } from 'react';

import AdminLayout from '../../../components/admin/AdminLayout';
import AdminIcon from '../../../components/admin/AdminIcon';
import { useConfirmDialog } from '../../../components/admin/ConfirmDialog';
import { authJson } from '../../../components/admin/authFetch';
import { toast } from '../../../components/admin/Toast';

interface User { id: number; username: string; email: string; role: string; status: 'active' | 'inactive'; joinDate: string; posts: number; }
interface UserFormData { username: string; email: string; password: string; role: string; status: string; }
interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const PAGE_SIZE = 20;

export default function AdminUsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({ username: '', email: '', password: '', role: 'author', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { confirm, confirmDialog } = useConfirmDialog();

  const loadUsers = useCallback(async () => {
    setPageLoading(true);
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (appliedSearch) query.set('search', appliedSearch);

    const result = await authJson<{ users: any[]; pagination: Pagination }>(`/api/users?${query.toString()}`);
    setPageLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message || '加载用户列表失败');
      return;
    }

    setUsers(result.data.users.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      status: row.status,
      joinDate: row.createdAt ? new Date(row.createdAt).toLocaleDateString('zh-CN') : '-',
      posts: row.postsCount || 0,
    })));
    setPagination(result.data.pagination);
  }, [page, appliedSearch]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchTerm.trim());
  };

  const handleOpenAddModal = () => { setModalMode('add'); setEditingUser(null); setFormData({ username: '', email: '', password: '', role: 'author', status: 'active' }); setError(''); setShowModal(true); };
  const handleOpenEditModal = (user: User) => { setModalMode('edit'); setEditingUser(user); setFormData({ username: user.username, email: user.email, password: '', role: user.role, status: user.status }); setError(''); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setEditingUser(null); setError(''); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');

    if (modalMode === 'add') {
      const result = await authJson('/api/users', { method: 'POST', body: JSON.stringify(formData) });
      setLoading(false);
      if (result.success) {
        toast.success('用户创建成功');
        handleCloseModal();
        loadUsers();
      } else setError(result.message || '创建失败');
      return;
    }

    const updateData: Record<string, unknown> = { username: formData.username, email: formData.email, role: formData.role, status: formData.status };
    if (formData.password) updateData.password = formData.password;

    const result = await authJson(`/api/users/${editingUser?.id}`, { method: 'PUT', body: JSON.stringify(updateData) });
    setLoading(false);
    if (result.success) {
      toast.success('用户更新成功');
      handleCloseModal();
      loadUsers();
    } else setError(result.message || '更新失败');
  };

  const handleDeleteUser = async (id: number) => {
    const user = users.find((item) => item.id === id);
    if (!await confirm({ title: '删除这个用户？', description: `${user?.username || '该用户'} 的账号会被永久移除，名下文章将保留但不再关联作者。`, confirmLabel: '删除用户', dangerous: true })) return;
    const result = await authJson(`/api/users/${id}`, { method: 'DELETE' });
    if (result.success) {
      toast.success('删除成功');
      loadUsers();
    } else toast.error(result.message || '删除失败');
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const result = await authJson(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    if (result.success) {
      toast.success('状态更新成功');
      setUsers(prev => prev.map(user => (user.id === id ? { ...user, status: newStatus as User['status'] } : user)));
    } else toast.error(result.message || '状态更新失败');
  };

  const getRoleLabel = (role: string) => ({ admin: '管理员', editor: '编辑', author: '作者' }[role] || role);
  const getStatusLabel = (status: string) => status === 'active' ? '活跃' : '禁用';

  return (
    <AdminLayout>
      <div className="users-page">
        <div className="page-header"><h1 className="page-title">用户管理</h1><button className="btn-primary" onClick={handleOpenAddModal}><AdminIcon name="users" size={17} /> 添加用户</button></div>
        <div className="filters">
          <form className="search-box-admin" onSubmit={handleSearchSubmit}>
            <span className="search-icon-admin" aria-hidden="true">⌕</span>
            <input type="text" placeholder="搜索用户名或邮箱..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input-admin" />
            <button type="submit" className="search-submit-admin">搜索</button>
          </form>
        </div>
        <div className="data-table">
          <table>
            <thead><tr><th>用户名</th><th>邮箱</th><th>角色</th><th>状态</th><th>加入日期</th><th>文章数</th><th className="table-actions-column">操作</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="user-name">{user.username}</td><td>{user.email}</td>
                  <td><span className={`role-badge role-${user.role}`}>{getRoleLabel(user.role)}</span></td>
                  <td><span className={`status-badge ${user.status === 'active' ? 'active' : 'inactive'}`}>{getStatusLabel(user.status)}</span></td>
                  <td>{user.joinDate}</td><td>{user.posts}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => handleOpenEditModal(user)}>编辑</button>
                    <button className={`action-btn ${user.status === 'active' ? 'disable' : 'enable'}`} onClick={() => handleToggleStatus(user.id, user.status)}>{user.status === 'active' ? '禁用' : '启用'}</button>
                    <button className="action-btn delete" onClick={() => handleDeleteUser(user.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageLoading && users.length === 0 && (<div className="loading-state">加载中...</div>)}
          {!pageLoading && users.length === 0 && (<div className="empty-state"><p>没有找到匹配的用户</p></div>)}
        </div>

        <div className="pagination-admin">
          <button className="pagination-btn-admin" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || pageLoading}>上一页</button>
          <span className="pagination-info">
            {pagination.total === 0 ? '共 0 位用户' : `第 ${pagination.page} / ${Math.max(pagination.totalPages, 1)} 页，共 ${pagination.total} 位用户`}
          </span>
          <button className="pagination-btn-admin" onClick={() => setPage(p => p + 1)} disabled={pagination.totalPages === 0 || page >= pagination.totalPages || pageLoading}>下一页</button>
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>{modalMode === 'add' ? '添加用户' : '编辑用户'}</h2><button className="modal-close" onClick={handleCloseModal}>×</button></div>
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group"><label htmlFor="username">用户名 *</label><input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} required placeholder="请输入用户名" /></div>
              <div className="form-group"><label htmlFor="email">邮箱 *</label><input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="请输入邮箱" /></div>
              <div className="form-group"><label htmlFor="password">密码 {modalMode === 'add' ? '*' : '（留空则不修改）'}</label><input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required={modalMode === 'add'} placeholder={modalMode === 'add' ? '请输入密码' : '留空则不修改密码'} /></div>
              <div className="form-group"><label htmlFor="role">角色</label><select id="role" name="role" value={formData.role} onChange={handleInputChange}><option value="author">作者</option><option value="editor">编辑</option><option value="admin">管理员</option></select></div>
              <div className="form-group"><label htmlFor="status">状态</label><select id="status" name="status" value={formData.status} onChange={handleInputChange}><option value="active">活跃</option><option value="inactive">禁用</option></select></div>
              <div className="modal-actions"><button type="button" className="btn-secondary" onClick={handleCloseModal}>取消</button><button type="submit" className="btn-primary" disabled={loading}>{loading ? '处理中...' : (modalMode === 'add' ? '创建' : '保存')}</button></div>
            </form>
          </div>
        </div>
      )}
      {confirmDialog}
    </AdminLayout>
  );
}
