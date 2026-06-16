'use client';

import React, { useState } from 'react';

import AdminLayout from '../../../components/admin/AdminLayout';

interface User { id: number; username: string; email: string; role: string; status: 'active' | 'inactive'; joinDate: string; posts: number; }
interface UserFormData { username: string; email: string; password: string; role: string; status: string; }

const usersStyles = `
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal-content { background: white; border-radius: 8px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
  .modal-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #111827; }
  .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; line-height: 1; }
  .modal-close:hover { color: #111827; }
  form { padding: 24px; }
  .form-group { margin-bottom: 20px; }
  .form-group label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151; }
  .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; transition: border-color 0.2s, box-shadow 0.2s; }
  .form-group input:focus, .form-group select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .error-message { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .btn-secondary { padding: 10px 20px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }
  .modal-actions .btn-primary { padding: 10px 20px; border: none; background: #3b82f6; color: white; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
  .modal-actions .btn-primary:hover { background: #2563eb; }
  .modal-actions .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
`;

export default function AdminUsersContent({ users }: { users: User[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({ username: '', email: '', password: '', role: 'author', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredUsers = users.filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenAddModal = () => { setModalMode('add'); setEditingUser(null); setFormData({ username: '', email: '', password: '', role: 'author', status: 'active' }); setError(''); setShowModal(true); };
  const handleOpenEditModal = (user: User) => { setModalMode('edit'); setEditingUser(user); setFormData({ username: user.username, email: user.email, password: '', role: user.role, status: user.status }); setError(''); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setEditingUser(null); setError(''); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { setError('登录已过期'); setLoading(false); window.location.href = '/admin/login'; return; }
      if (modalMode === 'add') {
        const response = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formData) });
        const data = await response.json();
        if (response.ok) { alert('用户创建成功'); handleCloseModal(); window.location.reload(); } else setError(data.message || '创建失败');
      } else {
        const updateData: any = { username: formData.username, email: formData.email, role: formData.role, status: formData.status };
        if (formData.password) updateData.password = formData.password;
        const response = await fetch(`/api/users/${editingUser?.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updateData) });
        const data = await response.json();
        if (response.ok) { alert('用户更新成功'); handleCloseModal(); window.location.reload(); } else setError(data.message || '更新失败');
      }
    } catch (err) { console.error('Error:', err); setError('操作失败'); } finally { setLoading(false); }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('确定要删除这个用户吗？')) return;
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { alert('登录已过期'); window.location.href = '/admin/login'; return; }
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) { alert('删除成功'); window.location.reload(); } else { const data = await response.json(); alert(data.message || '删除失败'); }
    } catch (error) { console.error('Error deleting user:', error); alert('删除失败'); }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { alert('登录已过期'); window.location.href = '/admin/login'; return; }
      const response = await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) });
      if (response.ok) { alert('状态更新成功'); window.location.reload(); } else { const data = await response.json(); alert(data.message || '状态更新失败'); }
    } catch (error) { console.error('Error toggling status:', error); alert('状态更新失败'); }
  };

  const getRoleLabel = (role: string) => ({ admin: '管理员', editor: '编辑', author: '作者' }[role] || role);
  const getStatusLabel = (status: string) => status === 'active' ? '活跃' : '禁用';

  return (
    <AdminLayout>
      <style dangerouslySetInnerHTML={{ __html: usersStyles }} />
      <div className="users-page">
        <div className="page-header"><h1 className="page-title">用户管理</h1><button className="btn-primary" onClick={handleOpenAddModal}><span>➕</span> 添加用户</button></div>
        <div className="filters"><div className="search-box-admin"><span className="search-icon-admin">🔍</span><input type="text" placeholder="搜索用户名或邮箱..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input-admin" /></div></div>
        <div className="data-table">
          <table>
            <thead><tr><th>用户名</th><th>邮箱</th><th>角色</th><th>状态</th><th>加入日期</th><th>文章数</th><th style={{ width: '150px' }}>操作</th></tr></thead>
            <tbody>
              {filteredUsers.map((user) => (
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
          {filteredUsers.length === 0 && (<div className="empty-state"><p>没有找到匹配的用户</p></div>)}
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
    </AdminLayout>
  );
}
