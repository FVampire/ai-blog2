'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import EnhancedImageUpload from '../EnhancedImageUpload';
import MarkdownEditor from '../MarkdownEditor';
import { confirmDiscardChanges, useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import AdminLayout from './AdminLayout';
import ConfirmDialog from './ConfirmDialog';
import { toast } from './Toast';

interface Tag { id: number; name: string; slug: string; }
interface Category { id: number; name: string; }
interface PostOption { id: number; title: string; }
type Status = 'draft' | 'published' | 'archived';
interface FormData { title: string; slug: string; excerpt: string; content: string; imageUrl: string; status: Status; categoryId: number | null; tagIds: number[]; prevPostId: number | null; nextPostId: number | null; }

const emptyForm: FormData = { title: '', slug: '', excerpt: '', content: '', imageUrl: '', status: 'draft', categoryId: null, tagIds: [], prevPostId: null, nextPostId: null };

export default function PostEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const editing = Boolean(postId);
  const draftKey = editing ? `admin:post-draft:${postId}` : 'admin:post-draft:new';
  const [form, setForm] = useState<FormData>(emptyForm);
  const [serverSnapshot, setServerSnapshot] = useState(JSON.stringify(emptyForm));
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [vectorInfo, setVectorInfo] = useState<{ hasVectors: boolean; model?: string } | null>(null);
  const [vectorBusy, setVectorBusy] = useState(false);
  const [confirmVectorDelete, setConfirmVectorDelete] = useState(false);
  const [userRole, setUserRole] = useState('author');
  const dirty = ready && JSON.stringify(form) !== serverSnapshot;
  useUnsavedChanges(dirty && !loading);

  const restoreDraft = (base: FormData) => {
    setServerSnapshot(JSON.stringify(base));
    try {
      const stored = localStorage.getItem(draftKey);
      const draft = stored ? JSON.parse(stored) as { data?: FormData; savedAt?: string } : null;
      setForm(draft?.data ? { ...base, ...draft.data } : base);
      if (draft?.savedAt) { setLastSaved(new Date(draft.savedAt)); toast.success('已恢复本地草稿'); }
    } catch {
      localStorage.removeItem(draftKey); setForm(base);
    }
    setReady(true);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [tagsResponse, categoriesResponse, postsResponse, meResponse] = await Promise.all([
        fetch('/api/tags'), fetch('/api/post-categories'), fetch('/api/posts?limit=100'), fetch('/api/auth/me'),
      ]);
      const [tagsData, categoriesData, postsData, meData] = await Promise.all([tagsResponse.json(), categoriesResponse.json(), postsResponse.json(), meResponse.json()]);
      if (cancelled) return;
      if (tagsData.success) setTags(tagsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (postsData.success) setPosts(postsData.data.posts.filter((post: PostOption) => post.id !== Number(postId)).map((post: PostOption) => ({ id: post.id, title: post.title })));
      const role = meData.data?.user?.role || 'author';
      setUserRole(role);

      if (!editing) { restoreDraft(emptyForm); return; }
      try {
        const postResponse = await fetch(`/api/posts/${postId}`);
        const postData = await postResponse.json();
        if (!postData.success) throw new Error(postData.message || '文章不存在');
        const post = postData.data.post;
        const base: FormData = {
          title: post.title, slug: post.slug, excerpt: post.excerpt || '', content: post.content || '', imageUrl: post.imageUrl || '', status: post.status,
          categoryId: post.categoryId || null, tagIds: post.tags.map((tag: Tag) => tag.id), prevPostId: post.prev_post_id || null, nextPostId: post.next_post_id || null,
        };
        restoreDraft(base);
        if (role === 'admin') {
          const vectorResponse = await fetch(`/api/admin/vector/${postId}`);
          const vectorData = await vectorResponse.json();
          if (vectorData.success) setVectorInfo({ hasVectors: vectorData.data.hasVectors, model: vectorData.data.vectors?.model });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '加载文章失败'); router.push('/admin/posts');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [editing, postId]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      const savedAt = new Date();
      localStorage.setItem(draftKey, JSON.stringify({ data: form, savedAt: savedAt.toISOString() }));
      setLastSaved(savedAt);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [dirty, draftKey, form]);

  const wordCount = useMemo(() => form.content.replace(/[#*_>`~\[\]()-]/g, ' ').trim().split(/\s+/).filter(Boolean).length, [form.content]);
  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm((current) => ({ ...current, [key]: value }));
  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) { toast.error('标题和 Slug 不能为空'); return; }
    setLoading(true);
    try {
      const response = await fetch(editing ? `/api/posts/${postId}` : '/api/posts', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || '保存失败');
      localStorage.removeItem(draftKey); setServerSnapshot(JSON.stringify(form)); toast.success(editing ? '文章已更新' : '文章已创建'); router.push('/admin/posts');
    } catch (error) { toast.error(error instanceof Error ? error.message : '保存失败'); }
    finally { setLoading(false); }
  };

  const generateVector = async () => {
    if (!postId) return; setVectorBusy(true);
    const response = await fetch(`/api/admin/vector/${postId}`, { method: 'POST' }); const data = await response.json(); setVectorBusy(false);
    if (data.success) { setVectorInfo({ hasVectors: true, model: data.data.model }); toast.success(data.message || '向量已生成'); } else toast.error(data.message || '生成向量失败');
  };
  const deleteVector = async () => {
    if (!postId) return; setVectorBusy(true);
    const response = await fetch(`/api/admin/vector/${postId}`, { method: 'DELETE' }); const data = await response.json(); setVectorBusy(false); setConfirmVectorDelete(false);
    if (data.success) { setVectorInfo({ hasVectors: false }); toast.success(data.message || '向量已删除'); } else toast.error(data.message || '删除向量失败');
  };

  if (!ready) return <AdminLayout><div className="loading-state">加载编辑器...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="post-editor-page">
        <form onSubmit={submit} className="post-editor-form post-editor-workspace">
          <main className="writing-column">
            <header className="editor-header">
              <div><p className="page-eyebrow">{editing ? '编辑文章' : '新建文章'}</p><small>{lastSaved ? `本地草稿已保存 · ${lastSaved.toLocaleTimeString('zh-CN')}` : '本地草稿自动保存已开启'} · {wordCount} 词</small></div>
              <button type="button" className="text-button" onClick={() => { if (confirmDiscardChanges(dirty)) router.push('/admin/posts'); }}>返回列表</button>
            </header>
            <input className="editor-title-input" value={form.title} onChange={(event) => { const title = event.target.value; setForm((current) => ({ ...current, title, slug: current.slug || generateSlug(title) })); }} placeholder="文章标题" aria-label="文章标题" required />
            <div className="slug-field"><span>/posts/</span><input value={form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="article-slug" aria-label="文章 Slug" required /></div>
            <textarea className="editor-excerpt" value={form.excerpt} onChange={(event) => set('excerpt', event.target.value)} placeholder="写一段摘要，让读者知道为什么值得继续看……" aria-label="文章摘要" />
            <section className="writing-surface"><MarkdownEditor value={form.content} onChange={(content) => set('content', content)} placeholder="从这里开始写作……" /></section>
          </main>

          <aside className="metadata-sidebar">
            <div className="metadata-actions"><button type="button" className="btn-secondary" onClick={() => { if (confirmDiscardChanges(dirty)) router.push('/admin/posts'); }} disabled={loading}>取消</button><button type="submit" className="btn-primary" disabled={loading}>{loading ? '保存中...' : editing ? '保存修改' : '创建文章'}</button></div>
            <section className="metadata-panel"><h2>发布</h2><div className="form-group"><label>状态</label><select value={form.status} onChange={(event) => set('status', event.target.value as Status)}><option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已归档</option></select></div></section>
            <section className="metadata-panel"><h2>封面</h2><EnhancedImageUpload onUploadSuccess={(url) => set('imageUrl', url)} defaultImage={form.imageUrl} onSelectImage={(url) => set('imageUrl', url)} /></section>
            <section className="metadata-panel"><h2>归类</h2><div className="form-group"><label>所属专栏</label><select value={form.categoryId ?? ''} onChange={(event) => set('categoryId', event.target.value ? Number(event.target.value) : null)}><option value="">暂不归类</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div className="form-group"><label>标签</label><div className="checkbox-group compact-tags">{tags.map((tag) => <label key={tag.id} className="checkbox-label"><input type="checkbox" checked={form.tagIds.includes(tag.id)} onChange={() => set('tagIds', form.tagIds.includes(tag.id) ? form.tagIds.filter((id) => id !== tag.id) : [...form.tagIds, tag.id])} /><span>{tag.name}</span></label>)}{tags.length === 0 && <small>暂无标签，前往 <Link href="/admin/tags">标签管理</Link> 创建。</small>}</div></div></section>
            <section className="metadata-panel"><h2>系列导航</h2>{editing ? <><div className="form-group"><label>上一篇</label><select value={form.prevPostId || ''} onChange={(event) => set('prevPostId', event.target.value ? Number(event.target.value) : null)}><option value="">无</option>{posts.map((post) => <option value={post.id} key={post.id}>{post.title}</option>)}</select></div><div className="form-group"><label>下一篇</label><select value={form.nextPostId || ''} onChange={(event) => set('nextPostId', event.target.value ? Number(event.target.value) : null)}><option value="">无</option>{posts.map((post) => <option value={post.id} key={post.id}>{post.title}</option>)}</select></div></> : <p className="metadata-note">创建文章后可配置上下篇，系统会同步双向导航。</p>}</section>
            {userRole === 'admin' && <section className="metadata-panel"><h2>向量搜索</h2>{editing ? <><p className={`vector-status ${vectorInfo?.hasVectors ? 'has-vectors' : 'no-vectors'}`}>{vectorInfo === null ? '正在读取状态…' : vectorInfo.hasVectors ? `已生成${vectorInfo.model ? ` · ${vectorInfo.model}` : ''}` : '尚未生成'}</p><div className="vector-actions"><button type="button" className="btn-vector" onClick={generateVector} disabled={vectorBusy}>{vectorBusy ? '处理中...' : vectorInfo?.hasVectors ? '重新生成' : '生成向量'}</button>{vectorInfo?.hasVectors && <button type="button" className="text-button danger" onClick={() => setConfirmVectorDelete(true)}>删除</button>}</div></> : <p className="metadata-note">文章创建后才能生成向量。</p>}</section>}
          </aside>
        </form>
      </div>
      <ConfirmDialog open={confirmVectorDelete} title="删除文章向量？" description="文章仍会保留，但在重新生成前不会进入向量搜索结果。" confirmLabel="删除向量" dangerous busy={vectorBusy} onConfirm={deleteVector} onCancel={() => setConfirmVectorDelete(false)} />
    </AdminLayout>
  );
}
