'use client';

import React, { useState, useEffect } from 'react';

import AdminLayout from '../../../components/admin/AdminLayout';
import { toast } from '../../../components/admin/Toast';

interface Tag { id: number; name: string; slug: string; color: string; created_at: string; post_count: number; }

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', color: '#FF6B6B' });

  useEffect(() => { loadTags(); }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags');
      const data = await response.json();
      if (data.success) setTags(data.data);
    } catch (error) { console.error('Load tags error:', error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags';
      const method = editingTag ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (data.success) { toast.success(editingTag ? '更新成功' : '创建成功'); setShowModal(false); setFormData({ name: '', slug: '', color: '#FF6B6B' }); setEditingTag(null); loadTags(); }
      else toast.error(data.message || '操作失败');
    } catch (error) { console.error('Submit error:', error); toast.error('操作失败'); }
  };

  const handleEdit = (tag: Tag) => { setEditingTag(tag); setFormData({ name: tag.name, slug: tag.slug, color: tag.color || '#FF6B6B' }); setShowModal(true); };
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个标签吗？')) return;
    try {
      const response = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) { toast.success('删除成功'); setTags((current) => current.filter((tag) => tag.id !== id)); } else toast.error(data.message || '删除失败');
    } catch (error) { console.error('Delete error:', error); toast.error('删除失败'); }
  };
  const handleAdd = () => { setEditingTag(null); setFormData({ name: '', slug: '', color: '#FF6B6B' }); setShowModal(true); };

  return (
    <AdminLayout>
      <div className="tags-page">
        <div className="page-header">
          <h1 className="page-title">标签管理</h1>
          <button className="btn-primary" onClick={handleAdd}><span>➕</span> 新建标签</button>
        </div>
        {loading ? (<div className="loading-state">加载中...</div>) : (
          <div className="data-table">
            <table>
              <thead><tr><th>标签名称</th><th>Slug</th><th style={{ width: '100px' }}>颜色</th><th>文章数</th><th>创建时间</th><th style={{ width: '150px' }}>操作</th></tr></thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>{tag.name}</td><td>{tag.slug}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: tag.color, border: '1px solid #DEE2E6' }} /><span style={{ fontSize: '12px', color: '#6C757D' }}>{tag.color}</span></div></td>
                    <td>{tag.post_count}</td><td>{new Date(tag.created_at).toLocaleDateString('zh-CN')}</td>
                    <td><button className="action-btn edit" onClick={() => handleEdit(tag)}>编辑</button><button className="action-btn delete" onClick={() => handleDelete(tag.id)}>删除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tags.length === 0 && (<div className="empty-state"><p>还没有标签，点击上方按钮创建第一个标签</p></div>)}
          </div>
        )}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h2>{editingTag ? '编辑标签' : '新建标签'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group"><label>标签名称 *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="例如: JavaScript" /></div>
                  <div className="form-group"><label>Slug *</label><input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required placeholder="例如: javascript" /><small>URL友好的标识符</small></div>
                  <div className="form-group"><label>颜色 *</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} style={{ width: '60px', height: '40px', border: '2px solid #DEE2E6', borderRadius: '8px', cursor: 'pointer' }} />
                      <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} pattern="^#[0-9A-Fa-f]{6}$" placeholder="#FF6B6B" style={{ flex: 1, padding: '8px 12px', border: '2px solid #DEE2E6', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace' }} />
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: formData.color, border: '2px solid #DEE2E6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                    </div><small>标签的显示颜色，格式为 #RRGGBB</small>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn-primary">{editingTag ? '更新' : '创建'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
