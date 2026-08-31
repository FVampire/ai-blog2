'use client';

import React, { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import AdminLayout from '../../../../../components/admin/AdminLayout';
import { toast } from '../../../../../components/admin/Toast';
import EnhancedImageUpload from '../../../../../components/EnhancedImageUpload';
import MarkdownEditor from '../../../../../components/MarkdownEditor';
import { confirmDiscardChanges, useUnsavedChanges } from '../../../../../hooks/useUnsavedChanges';

interface Tag { id: number; name: string; slug: string; }
interface PostOption { id: number; title: string; }

const editPostStyles = `
  .vector-section { background: #f9fafb; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb; }
  .vector-status { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 14px; }
  .vector-status.loading { color: #6b7280; }
  .vector-status.has-vectors { color: #059669; }
  .vector-status.has-vectors .vector-icon { width: 20px; height: 20px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .vector-status.no-vectors { color: #dc2626; }
  .vector-status.no-vectors .vector-icon { width: 20px; height: 20px; background: #ef4444; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .vector-text small { color: #6b7280; font-size: 12px; }
  .vector-actions { display: flex; gap: 8px; }
  .btn-vector { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
  .btn-vector:hover:not(:disabled) { background: #2563eb; }
  .btn-vector:disabled { background: #93c5fd; cursor: not-allowed; }
  .btn-vector-delete { padding: 8px 16px; background: white; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .btn-vector-delete:hover { background: #fef2f2; border-color: #dc2626; }
  .vector-message { margin-top: 12px; padding: 10px 12px; border-radius: 6px; font-size: 13px; }
  .vector-message.success { background: #d1fae5; color: #065f46; }
  .vector-message.error { background: #fee2e2; color: #991b1b; }
`;

export default function EditPost() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [availablePosts, setAvailablePosts] = useState<PostOption[]>([]);
  const [vectorInfo, setVectorInfo] = useState<{ hasVectors: boolean; model?: string } | null>(null);
  const [generatingVector, setGeneratingVector] = useState(false);
  const [vectorMessage, setVectorMessage] = useState({ type: '', text: '' });
  const [draftReady, setDraftReady] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [serverSnapshot, setServerSnapshot] = useState('');
  const [formData, setFormData] = useState({
    title: '', slug: '', excerpt: '', content: '', imageUrl: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    tagIds: [] as number[], prevPostId: null as number | null, nextPostId: null as number | null,
  });
  const draftKey = `admin:post-draft:${id}`;
  const dirty = draftReady && JSON.stringify(formData) !== serverSnapshot;
  useUnsavedChanges(dirty && !loading);

  const loadPost = async () => {
    try {
      setPageLoading(true);
      const response = await fetch(`/api/posts/${id}`);
      const data = await response.json();
      if (data.success) {
        const post = data.data.post;
        const serverData = {
          title: post.title, slug: post.slug, excerpt: post.excerpt || '', content: post.content || '',
          imageUrl: post.imageUrl || '', status: post.status,
          tagIds: post.tags.map((t: any) => t.id),
          prevPostId: post.prev_post_id || null, nextPostId: post.next_post_id || null,
        };
        setServerSnapshot(JSON.stringify(serverData));
        try {
          const stored = localStorage.getItem(draftKey);
          const draft = stored ? JSON.parse(stored) as { data?: typeof serverData; savedAt?: string } : null;
          setFormData(draft?.data || serverData);
          if (draft?.savedAt) { setLastSaved(new Date(draft.savedAt)); toast.success('已恢复本地草稿'); }
        } catch {
          localStorage.removeItem(draftKey);
          setFormData(serverData);
        }
        setDraftReady(true);
      } else { toast.error('加载文章失败'); router.push('/admin/posts'); }
    } catch (error) { console.error('Load post error:', error); toast.error('加载文章失败'); router.push('/admin/posts'); }
    finally { setPageLoading(false); }
  };

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      if (data.success) setTags(data.data);
    } catch (error) { console.error('Load tags error:', error); }
  };

  const loadAvailablePosts = async () => {
    try {
      const response = await fetch('/api/posts?limit=100');
      const data = await response.json();
      if (data.success) {
        const posts = data.data.posts
          .filter((p: { id: number }) => p.id !== Number(id))
          .map((p: { id: number; title: string }) => ({ id: p.id, title: p.title }));
        setAvailablePosts(posts);
      }
    } catch (error) { console.error('Load posts error:', error); }
  };

  const loadVectorInfo = async () => {
    try {
      const response = await fetch(`/api/admin/vector/${id}`);
      const data = await response.json();
      if (data.success) setVectorInfo({ hasVectors: data.data.hasVectors, model: data.data.vectors?.model });
    } catch (error) { console.error('Load vector info error:', error); }
  };

  useEffect(() => { if (id) { loadPost(); loadTags(); loadAvailablePosts(); loadVectorInfo(); } }, [id]);

  useEffect(() => {
    if (!draftReady || !dirty) return;
    const timer = window.setTimeout(() => {
      const savedAt = new Date();
      localStorage.setItem(draftKey, JSON.stringify({ data: formData, savedAt: savedAt.toISOString() }));
      setLastSaved(savedAt);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draftKey, draftReady, dirty, formData]);

  const handleGenerateVector = async () => {
    if (!confirm('确定要为此文章生成向量吗？')) return;
    setGeneratingVector(true); setVectorMessage({ type: '', text: '' });
    try {
      const response = await fetch(`/api/admin/vector/${id}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) { setVectorInfo({ hasVectors: true, model: data.data.model }); setVectorMessage({ type: 'success', text: data.message }); }
      else setVectorMessage({ type: 'error', text: data.message });
    } catch (error: any) { setVectorMessage({ type: 'error', text: error.message || '生成向量失败' }); }
    finally { setGeneratingVector(false); }
  };

  const handleDeleteVector = async () => {
    if (!confirm('确定要删除此文章的向量吗？')) return;
    try {
      const response = await fetch(`/api/admin/vector/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) { setVectorInfo({ hasVectors: false }); setVectorMessage({ type: 'success', text: data.message }); }
      else setVectorMessage({ type: 'error', text: data.message });
    } catch (error: any) { setVectorMessage({ type: 'error', text: error.message || '删除向量失败' }); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) { toast.error('标题和 Slug 不能为空'); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) { localStorage.removeItem(draftKey); setServerSnapshot(JSON.stringify(formData)); toast.success('文章更新成功'); router.push('/admin/posts'); }
      else toast.error(data.message || '更新失败');
    } catch (error) { console.error('Update post error:', error); toast.error('更新失败'); }
    finally { setLoading(false); }
  };

  const toggleTag = (tagId: number) => {
    const tagIds = formData.tagIds.includes(tagId) ? formData.tagIds.filter(id => id !== tagId) : [...formData.tagIds, tagId];
    setFormData({ ...formData, tagIds });
  };

  if (pageLoading) return (<AdminLayout><div className="loading-state">加载中...</div></AdminLayout>);

  return (
    <AdminLayout>
      <style dangerouslySetInnerHTML={{ __html: editPostStyles }} />
      <div className="post-editor-page">
        <div className="page-header">
          <div><h1 className="page-title">编辑文章</h1><small>{lastSaved ? `草稿已自动保存 · ${lastSaved.toLocaleTimeString('zh-CN')}` : '草稿自动保存已开启'}</small></div>
          <button type="button" className="btn-secondary" onClick={() => { if (confirmDiscardChanges(dirty)) router.push('/admin/posts'); }}>返回列表</button>
        </div>

        <form onSubmit={handleSubmit} className="post-editor-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}><label>文章标题 *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
            <div className="form-group" style={{ flex: 1 }}><label>状态 *</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                <option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已归档</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>URL Slug *</label><input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /><small>文章的URL标识符</small></div>
          <div className="form-group"><label>摘要</label><textarea value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} style={{ minHeight: '100px' }} /></div>
          <div className="form-group"><label>封面图片</label><EnhancedImageUpload onUploadSuccess={(url) => setFormData({ ...formData, imageUrl: url })} defaultImage={formData.imageUrl} onSelectImage={(url) => setFormData({ ...formData, imageUrl: url })} /></div>
          <div className="form-group"><label>文章内容 *</label><MarkdownEditor value={formData.content} onChange={(content) => setFormData({ ...formData, content })} /></div>
          <div className="form-group"><label>标签</label>
            <div className="checkbox-group">
              {tags.map(tag => (<label key={tag.id} className="checkbox-label"><input type="checkbox" checked={formData.tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} /><span>{tag.name}</span></label>))}
              {tags.length === 0 && (<p style={{ color: '#6C757D' }}>暂无标签，请先在<Link href="/admin/tags" style={{ color: '#FF6B6B' }}>标签管理</Link>中创建标签</p>)}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}><label>上一篇文章</label>
              <select value={formData.prevPostId || ''} onChange={(e) => setFormData({ ...formData, prevPostId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">无</option>{availablePosts.map(post => (<option key={post.id} value={post.id}>{post.title}</option>))}
              </select><small>上一篇文章导航链接</small>
            </div>
            <div className="form-group" style={{ flex: 1 }}><label>下一篇文章</label>
              <select value={formData.nextPostId || ''} onChange={(e) => setFormData({ ...formData, nextPostId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">无</option>{availablePosts.map(post => (<option key={post.id} value={post.id}>{post.title}</option>))}
              </select><small>下一篇文章导航链接</small>
            </div>
          </div>
          <div className="form-group"><label>向量搜索</label>
            <div className="vector-section">
              {vectorInfo === null ? (<p className="vector-status loading">加载中...</p>)
                : vectorInfo.hasVectors ? (
                  <div className="vector-status has-vectors"><span className="vector-icon">✓</span><span className="vector-text">已生成向量 {vectorInfo.model && <small>({vectorInfo.model})</small>}</span></div>
                ) : (<div className="vector-status no-vectors"><span className="vector-icon">✗</span><span className="vector-text">未生成向量</span></div>)}
              <div className="vector-actions">
                <button type="button" className="btn-vector" onClick={handleGenerateVector} disabled={generatingVector}>
                  {generatingVector ? '生成中...' : (vectorInfo?.hasVectors ? '重新生成' : '生成向量')}
                </button>
                {vectorInfo?.hasVectors && (<button type="button" className="btn-vector-delete" onClick={handleDeleteVector}>删除向量</button>)}
              </div>
              {vectorMessage.text && (<div className={`vector-message ${vectorMessage.type}`}>{vectorMessage.text}</div>)}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { if (confirmDiscardChanges(dirty)) router.push('/admin/posts'); }} disabled={loading}>取消</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? '更新中...' : '更新文章'}</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
