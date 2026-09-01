'use client';

import React, { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AdminLayout from '../../../../components/admin/AdminLayout';
import { toast } from '../../../../components/admin/Toast';
import EnhancedImageUpload from '../../../../components/EnhancedImageUpload';
import MarkdownEditor from '../../../../components/MarkdownEditor';
import { confirmDiscardChanges, useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface PostCategory {
  id: number;
  name: string;
}

const DRAFT_KEY = 'admin:post-draft:new';

export default function NewPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    categoryId: null as number | null,
    tagIds: [] as number[],
  });

  const emptySnapshot = JSON.stringify({
    title: '', slug: '', excerpt: '', content: '', imageUrl: '', status: 'draft', categoryId: null, tagIds: [],
  });
  const dirty = draftReady && JSON.stringify(formData) !== emptySnapshot;
  useUnsavedChanges(dirty && !loading);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const draft = JSON.parse(stored) as { data?: typeof formData; savedAt?: string };
        if (draft.data) {
          setFormData((current) => ({ ...current, ...draft.data }));
          if (draft.savedAt) setLastSaved(new Date(draft.savedAt));
          toast.success('已恢复本地草稿');
        }
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady || !dirty) return;
    const timer = window.setTimeout(() => {
      const savedAt = new Date();
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: formData, savedAt: savedAt.toISOString() }));
      setLastSaved(savedAt);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draftReady, dirty, formData]);

  useEffect(() => { loadTags(); loadCategories(); }, []);

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      if (data.success) setTags(data.data);
    } catch (error) { console.error('Load tags error:', error); }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/post-categories');
      const data = await response.json();
      if (data.success) setCategories(data.data);
    } catch (error) { console.error('Load post categories error:', error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) { toast.error('标题和 Slug 不能为空'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) { localStorage.removeItem(DRAFT_KEY); toast.success('文章创建成功'); router.push('/admin/posts'); }
      else toast.error(data.message || '创建失败');
    } catch (error) { console.error('Create post error:', error); toast.error('创建失败'); }
    finally { setLoading(false); }
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    if (!formData.slug) setFormData({ ...formData, title, slug: generateSlug(title) });
  };

  const toggleTag = (tagId: number) => {
    const tagIds = formData.tagIds.includes(tagId) ? formData.tagIds.filter(id => id !== tagId) : [...formData.tagIds, tagId];
    setFormData({ ...formData, tagIds });
  };

  return (
    <AdminLayout>
      <div className="post-editor-page">
        <div className="page-header">
          <div><h1 className="page-title">新建文章</h1><small>{lastSaved ? `草稿已自动保存 · ${lastSaved.toLocaleTimeString('zh-CN')}` : '草稿自动保存已开启'}</small></div>
          <button type="button" className="btn-secondary" onClick={() => { if (confirmDiscardChanges(dirty)) router.push('/admin/posts'); }}>返回列表</button>
        </div>

        <form onSubmit={handleSubmit} className="post-editor-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>文章标题 *</label>
              <input type="text" value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="输入文章标题" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>状态 *</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                <option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已归档</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>所属专栏</label>
            <select value={formData.categoryId ?? ''} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">暂不归类</option>
              {categories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}
            </select>
            <small>专栏是文章的大分类；一篇文章只能属于一个专栏</small>
          </div>

          <div className="form-group">
            <label>URL Slug *</label>
            <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="url-friendly-slug" required />
            <small>文章的URL标识符，只能包含小写字母、数字和连字符</small>
          </div>

          <div className="form-group">
            <label>摘要</label>
            <textarea value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="文章摘要，用于列表展示" style={{ minHeight: '100px' }} />
          </div>

          <div className="form-group">
            <label>封面图片</label>
            <EnhancedImageUpload onUploadSuccess={(url) => setFormData({ ...formData, imageUrl: url })} defaultImage={formData.imageUrl} onSelectImage={(url) => setFormData({ ...formData, imageUrl: url })} />
          </div>

          <div className="form-group">
            <label>文章内容 *</label>
            <MarkdownEditor value={formData.content} onChange={(content) => setFormData({ ...formData, content })} placeholder="使用Markdown格式编写文章内容..." />
          </div>

          <div className="form-group">
            <label>标签</label>
            <div className="checkbox-group">
              {tags.map(tag => (
                <label key={tag.id} className="checkbox-label">
                  <input type="checkbox" checked={formData.tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} />
                  <span>{tag.name}</span>
                </label>
              ))}
              {tags.length === 0 && (<p style={{ color: '#6C757D' }}>暂无标签，请先在<Link href="/admin/tags" style={{ color: '#FF6B6B' }}>标签管理</Link>中创建标签</p>)}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { if (confirmDiscardChanges(dirty)) router.push('/admin/posts'); }} disabled={loading}>取消</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? '创建中...' : '创建文章'}</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
