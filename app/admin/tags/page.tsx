'use client';

import React, { useState, useEffect } from 'react';

import AdminLayout from '../../../components/admin/AdminLayout';
import AdminIcon from '../../../components/admin/AdminIcon';
import { useConfirmDialog } from '../../../components/admin/ConfirmDialog';
import { toast } from '../../../components/admin/Toast';

interface Tag { id: number; name: string; slug: string; color: string; created_at: string; post_count: number; }

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', color: '#FF6B6B' });
  const { confirm, confirmDialog } = useConfirmDialog();

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
    const tag = tags.find((item) => item.id === id);
    if (!await confirm({ title: '删除这个标签？', description: `${tag?.name || '该标签'} 会从相关文章中移除，文章本身不会被删除。`, confirmLabel: '删除标签', dangerous: true })) return;
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
          <button className="btn-primary" onClick={handleAdd}><AdminIcon name="tags" size={17} /> 新建标签</button>
        </div>
        {loading ? (<div className="loading-state">加载中...</div>) : (
          <div className="data-table">
            <table>
              <thead><tr><th>标签名称</th><th>Slug</th><th className="table-color-column">颜色</th><th>文章数</th><th>创建时间</th><th className="table-actions-column">操作</th></tr></thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>{tag.name}</td><td>{tag.slug}</td>
                    <td><div className="color-value"><input type="color" className="color-readonly small" value={tag.color} disabled aria-label={`${tag.name} 的颜色`} /><code>{tag.color}</code></div></td>
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
                    <div className="color-field-row">
                      <input className="color-picker" type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                      <input className="color-text-input" type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} pattern="^#[0-9A-Fa-f]{6}$" placeholder="#FF6B6B" />
                      <input type="color" className="color-readonly preview" value={formData.color} disabled aria-label="当前颜色预览" />
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
        {confirmDialog}
      </div>
    </AdminLayout>
  );
}
