'use client';

import { useEffect, useState } from 'react';

import AdminLayout from '../../../components/admin/AdminLayout';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { authJson } from '../../../components/admin/authFetch';
import { toast } from '../../../components/admin/Toast';

interface Category { id: number; name: string; slug: string; description: string; color: string; sortOrder: number; postCount: number; }
const emptyForm = { name: '', slug: '', description: '', color: '#6C757D', sortOrder: 0 };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const result = await authJson<Category[]>('/api/post-categories');
    if (result.success) setCategories(result.data || []); else toast.error(result.message || '加载专栏失败');
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const beginEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, description: category.description, color: category.color, sortOrder: category.sortOrder });
  };
  const reset = () => { setEditingId(null); setForm(emptyForm); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    const result = await authJson(editingId ? `/api/post-categories/${editingId}` : '/api/post-categories', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (!result.success) { toast.error(result.message || '保存失败'); return; }
    toast.success(result.message || '专栏已保存'); reset(); await load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const result = await authJson(`/api/post-categories/${deleting.id}`, { method: 'DELETE' });
    if (result.success) { toast.success(result.message || '专栏已删除'); setDeleting(null); reset(); await load(); }
    else { toast.error(result.message || '删除失败'); setDeleting(null); }
  };

  return (
    <AdminLayout>
      <div className="categories-page">
        <div className="page-header"><div><p className="page-eyebrow">内容结构</p><h1 className="page-title">专栏管理</h1><p className="page-description">用稳定的大分类组织文章；标签继续承担更细的主题标记。</p></div></div>
        <div className="category-layout">
          <section className="dashboard-section category-list-panel">
            <div className="section-heading-row"><h2 className="section-title">全部专栏</h2><span className="muted-count">{categories.length} 个</span></div>
            {loading ? <div className="compact-empty">加载中...</div> : categories.length === 0 ? <div className="compact-empty"><strong>还没有专栏</strong><span>从右侧创建第一个专栏。</span></div> : (
              <div className="category-list">
                {categories.map((category) => (
                  <article className={`category-row ${editingId === category.id ? 'is-editing' : ''}`} key={category.id}>
                    <span className="category-color" style={{ backgroundColor: category.color }} />
                    <div className="category-main"><strong>{category.name}</strong><small>/{category.slug} · {category.postCount} 篇已发布</small>{category.description && <p>{category.description}</p>}</div>
                    <div className="category-actions"><button className="action-btn edit" onClick={() => beginEdit(category)}>编辑</button><button className="action-btn delete" onClick={() => setDeleting(category)}>删除</button></div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <aside className="dashboard-section category-form-panel">
            <div className="section-heading-row"><h2 className="section-title">{editingId ? '编辑专栏' : '新建专栏'}</h2>{editingId && <button className="text-button" onClick={reset}>取消编辑</button>}</div>
            <form className="category-form" onSubmit={submit}>
              <div className="form-group"><label>名称 *</label><input required value={form.name} onChange={(event) => { const name = event.target.value; setForm((current) => ({ ...current, name, slug: current.slug || generateSlug(name) })); }} placeholder="例如：工程实践" /></div>
              <div className="form-group"><label>Slug *</label><input required pattern="[a-z0-9-]+" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase() })} placeholder="engineering" /></div>
              <div className="form-group"><label>说明</label><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} placeholder="这个专栏收录什么内容？" /></div>
              <div className="category-form-row"><div className="form-group"><label>颜色</label><input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /></div><div className="form-group"><label>排序</label><input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></div></div>
              <button className="btn-primary" disabled={saving}>{saving ? '保存中...' : editingId ? '保存修改' : '创建专栏'}</button>
            </form>
          </aside>
        </div>
      </div>
      <ConfirmDialog open={Boolean(deleting)} title="删除这个专栏？" description={`${deleting?.name || ''} 下的 ${deleting?.postCount || 0} 篇文章不会被删除，但会变为“未归类”。`} confirmLabel="删除专栏" dangerous onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </AdminLayout>
  );
}
