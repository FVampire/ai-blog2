'use client';

import React, { useState, useEffect } from 'react';

import Link from 'next/link';

import AdminLayout from '../../../components/admin/AdminLayout';
import EnhancedImageUpload from '../../../components/EnhancedImageUpload';

interface Project {
  id: number;
  name: string;
  slug: string;
  description?: string;
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  status: 'active' | 'archived';
  featured: boolean;
  sortOrder: number;
  postCount?: number;
}

interface PostOption {
  id: number;
  title: string;
  slug: string;
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  techStack: '',
  repoUrl: '',
  demoUrl: '',
  imageUrl: '',
  status: 'active' as 'active' | 'archived',
  featured: false,
  sortOrder: 0,
  postIds: [] as number[],
};

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
    loadPosts();
  }, []);

  const getToken = () => localStorage.getItem('adminToken');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/projects', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setProjects(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/posts?status=published&limit=100', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        const list = data.data?.posts || [];
        setPosts(list.map((p: { id: number; title: string; slug: string }) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '');

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = async (project: Project) => {
    setEditingId(project.id);
    setForm({
      name: project.name,
      slug: project.slug,
      description: project.description || '',
      techStack: (project.techStack || []).join(', '),
      repoUrl: project.repoUrl || '',
      demoUrl: project.demoUrl || '',
      imageUrl: project.imageUrl || '',
      status: project.status,
      featured: project.featured,
      sortOrder: project.sortOrder,
      postIds: [],
    });

    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({ ...prev, postIds: data.data.linkedPostIds || [] }));
      }
    } catch (e) {
      console.error(e);
    }

    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        techStack: form.techStack.split(',').map((s) => s.trim()).filter(Boolean),
        repoUrl: form.repoUrl || undefined,
        demoUrl: form.demoUrl || undefined,
        imageUrl: form.imageUrl || undefined,
        status: form.status,
        featured: form.featured,
        sortOrder: form.sortOrder,
        postIds: form.postIds,
      };

      const url = editingId ? `/api/admin/projects/${editingId}` : '/api/admin/projects';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        loadProjects();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (e) {
      console.error(e);
      alert('操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此项目？关联的文章链接也会被移除。')) return;
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) loadProjects();
      else alert(data.message || '删除失败');
    } catch (e) {
      console.error(e);
    }
  };

  const togglePost = (postId: number) => {
    setForm((prev) => ({
      ...prev,
      postIds: prev.postIds.includes(postId)
        ? prev.postIds.filter((id) => id !== postId)
        : [...prev.postIds, postId],
    }));
  };

  return (
    <AdminLayout>
      <div className="projects-admin-page">
        <div className="page-header">
          <h1 className="page-title">项目管理</h1>
          <button className="btn-primary" onClick={openCreate}>
            <span>➕</span> 新建项目
          </button>
        </div>

        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>Slug</th>
                  <th>技术栈</th>
                  <th>状态</th>
                  <th>精选</th>
                  <th>文章数</th>
                  <th>排序</th>
                  <th style={{ width: '160px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.imageUrl && (
                          <img src={p.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                        )}
                        {p.name}
                      </div>
                    </td>
                    <td><code style={{ fontSize: 12 }}>{p.slug}</code></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(p.techStack || []).slice(0, 3).map((t) => (
                          <span key={t} style={{ fontSize: 11, padding: '2px 6px', background: '#e5e7eb', borderRadius: 4 }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: p.status === 'active' ? '#059669' : '#6b7280' }}>
                        {p.status === 'active' ? '展示中' : '已归档'}
                      </span>
                    </td>
                    <td>{p.featured ? '★' : '—'}</td>
                    <td>{p.postCount || 0}</td>
                    <td>{p.sortOrder}</td>
                    <td>
                      <Link href={`/projects/${p.slug}`} target="_blank" className="action-btn edit" style={{ marginRight: 4 }}>预览</Link>
                      <button className="action-btn edit" onClick={() => openEdit(p)}>编辑</button>
                      <button className="action-btn delete" onClick={() => handleDelete(p.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {projects.length === 0 && (
              <div className="empty-state"><p>还没有项目，点击上方按钮创建第一个项目</p></div>
            )}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? '编辑项目' : '新建项目'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>项目名称 *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            name,
                            slug: editingId ? prev.slug : generateSlug(name),
                          }));
                        }}
                        required
                        placeholder="例如: short-novel"
                      />
                    </div>
                    <div className="form-group">
                      <label>Slug *</label>
                      <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>项目描述</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="项目简介，展示在项目卡片和详情页"
                    />
                  </div>

                  <div className="form-group">
                    <label>技术栈</label>
                    <input
                      type="text"
                      value={form.techStack}
                      onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                      placeholder="用逗号分隔，例如: Next.js, TypeScript, PostgreSQL"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>仓库地址</label>
                      <input type="url" value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} placeholder="https://gitee.com/..." />
                    </div>
                    <div className="form-group">
                      <label>演示地址</label>
                      <input type="url" value={form.demoUrl} onChange={(e) => setForm({ ...form, demoUrl: e.target.value })} placeholder="https://demo.example.com" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>封面图片</label>
                    <EnhancedImageUpload
                      value={form.imageUrl}
                      onChange={(url) => setForm({ ...form, imageUrl: url })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>排序权重</label>
                      <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
                      <small>数字越小越靠前</small>
                    </div>
                    <div className="form-group">
                      <label>状态</label>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'archived' })}>
                        <option value="active">展示中</option>
                        <option value="archived">已归档</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                        精选项目（首页展示）
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>关联文章</label>
                    <div className="tag-checkboxes">
                      {posts.map((post) => (
                        <label key={post.id} className="tag-checkbox">
                          <input
                            type="checkbox"
                            checked={form.postIds.includes(post.id)}
                            onChange={() => togglePost(post.id)}
                          />
                          {post.title}
                        </label>
                      ))}
                      {posts.length === 0 && <small>暂无已发布文章</small>}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? '保存中...' : editingId ? '更新' : '创建'}
                    </button>
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
