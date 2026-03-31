import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import MarkdownEditor from '@/components/MarkdownEditor';
import EnhancedImageUpload from '@/components/EnhancedImageUpload';

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface PostOption {
  id: number;
  title: string;
}

const EditPost: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [availablePosts, setAvailablePosts] = useState<PostOption[]>([]);
  const [vectorInfo, setVectorInfo] = useState<{ hasVectors: boolean; model?: string } | null>(null);
  const [generatingVector, setGeneratingVector] = useState(false);
  const [vectorMessage, setVectorMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    tagIds: [] as number[],
    prevPostId: null as number | null,
    nextPostId: null as number | null,
  });

  const loadPost = async () => {
    try {
      setPageLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        const post = data.data.post;
        setFormData({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || '',
          content: post.content || '',
          imageUrl: post.imageUrl || '',
          status: post.status,
          tagIds: post.tags.map((t: any) => t.id),
          prevPostId: post.prev_post_id || null,
          nextPostId: post.next_post_id || null,
        });
      } else {
        alert('加载文章失败');
        router.push('/admin/posts');
      }
    } catch (error) {
      console.error('Load post error:', error);
      alert('加载文章失败');
      router.push('/admin/posts');
    } finally {
      setPageLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/tags', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTags(data.data);
      }
    } catch (error) {
      console.error('Load tags error:', error);
    }
  };

  const loadAvailablePosts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/posts?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        // API 返回的是 data: posts 数组，不是 data: { posts: [] }
        const posts = data.data
          .filter((p: any) => p.id !== Number(id))
          .map((p: any) => ({ id: p.id, title: p.title }));
        setAvailablePosts(posts);
      }
    } catch (error) {
      console.error('Load posts error:', error);
    }
  };

  useEffect(() => {
    if (id) {
      loadPost();
      loadTags();
      loadAvailablePosts();
      loadVectorInfo();
    }
  }, [id]);

  const loadVectorInfo = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/vector/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setVectorInfo({
          hasVectors: data.data.hasVectors,
          model: data.data.vectors?.model,
        });
      }
    } catch (error) {
      console.error('Load vector info error:', error);
    }
  };

  const handleGenerateVector = async () => {
    if (!confirm('确定要为此文章生成向量吗？这将用于向量搜索功能。')) {
      return;
    }

    setGeneratingVector(true);
    setVectorMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/vector/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setVectorInfo({
          hasVectors: true,
          model: data.data.model,
        });
        setVectorMessage({ type: 'success', text: data.message });
      } else {
        setVectorMessage({ type: 'error', text: data.message });
      }
    } catch (error: any) {
      setVectorMessage({ type: 'error', text: error.message || '生成向量失败' });
    } finally {
      setGeneratingVector(false);
    }
  };

  const handleDeleteVector = async () => {
    if (!confirm('确定要删除此文章的向量吗？删除后向量搜索将无法找到这篇文章。')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/vector/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setVectorInfo({ hasVectors: false });
        setVectorMessage({ type: 'success', text: data.message });
      } else {
        setVectorMessage({ type: 'error', text: data.message });
      }
    } catch (error: any) {
      setVectorMessage({ type: 'error', text: error.message || '删除向量失败' });
    }
  };

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug) {
      alert('标题和Slug不能为空');
      return;
    }

    console.log('📤 [Edit Post] Submitting form data:', {
      id,
      prevPostId: formData.prevPostId,
      nextPostId: formData.nextPostId,
      title: formData.title,
    });

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      console.log('✅ [Edit Post] Response:', data);

      if (data.success) {
        alert('文章更新成功');
        router.push('/admin/posts');
      } else {
        alert(data.message || '更新失败');
      }
    } catch (error) {
      console.error('Update post error:', error);
      alert('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    const tagIds = formData.tagIds.includes(tagId)
      ? formData.tagIds.filter(id => id !== tagId)
      : [...formData.tagIds, tagId];
    setFormData({ ...formData, tagIds });
  };

  if (pageLoading) {
    return (
      <AdminLayout>
        <div className="loading-state">加载中...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>编辑文章 - Blog Admin</title>
      </Head>

      <div className="post-editor-page">
        <div className="page-header">
          <h1 className="page-title">编辑文章</h1>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push('/admin/posts')}
          >
            返回列表
          </button>
        </div>

        <form onSubmit={handleSubmit} className="post-editor-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>文章标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入文章标题"
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>状态 *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>URL Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="url-friendly-slug"
              required
            />
            <small>文章的URL标识符，只能包含小写字母、数字和连字符</small>
          </div>

          <div className="form-group">
            <label>摘要</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="文章摘要，用于列表展示"
              style={{ minHeight: '100px' }}
            />
          </div>

          <div className="form-group">
            <label>封面图片</label>
            <EnhancedImageUpload
              onUploadSuccess={(url) => setFormData({ ...formData, imageUrl: url })}
              defaultImage={formData.imageUrl}
              onSelectImage={(url) => setFormData({ ...formData, imageUrl: url })}
            />
          </div>

          <div className="form-group">
            <label>文章内容 *</label>
            <MarkdownEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="使用Markdown格式编写文章内容..."
            />
          </div>

          <div className="form-group">
            <label>标签</label>
            <div className="checkbox-group">
              {tags.map(tag => (
                <label key={tag.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
              {tags.length === 0 && (
                <p style={{ color: '#6C757D' }}>
                  暂无标签，请先在<a href="/admin/tags" style={{ color: '#FF6B6B' }}>标签管理</a>中创建标签
                </p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>上一篇文章</label>
              <select
                value={formData.prevPostId || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  prevPostId: e.target.value ? Number(e.target.value) : null
                })}
              >
                <option value="">无</option>
                {availablePosts.map(post => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
              <small>在文章详情页底部显示"上一篇"导航链接</small>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>下一篇文章</label>
              <select
                value={formData.nextPostId || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  nextPostId: e.target.value ? Number(e.target.value) : null
                })}
              >
                <option value="">无</option>
                {availablePosts.map(post => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
              <small>在文章详情页底部显示"下一篇"导航链接</small>
            </div>
          </div>

          {/* 向量管理 */}
          <div className="form-group">
            <label>向量搜索</label>
            <div className="vector-section">
              {vectorInfo === null ? (
                <p className="vector-status loading">加载中...</p>
              ) : vectorInfo.hasVectors ? (
                <div className="vector-status has-vectors">
                  <span className="vector-icon">✓</span>
                  <span className="vector-text">
                    已生成向量 {vectorInfo.model && <small>({vectorInfo.model})</small>}
                  </span>
                </div>
              ) : (
                <div className="vector-status no-vectors">
                  <span className="vector-icon">✗</span>
                  <span className="vector-text">未生成向量</span>
                </div>
              )}
              <div className="vector-actions">
                <button
                  type="button"
                  className="btn-vector"
                  onClick={handleGenerateVector}
                  disabled={generatingVector}
                >
                  {generatingVector ? '生成中...' : (vectorInfo?.hasVectors ? '重新生成' : '生成向量')}
                </button>
                {vectorInfo?.hasVectors && (
                  <button
                    type="button"
                    className="btn-vector-delete"
                    onClick={handleDeleteVector}
                  >
                    删除向量
                  </button>
                )}
              </div>
              {vectorMessage.text && (
                <div className={`vector-message ${vectorMessage.type}`}>
                  {vectorMessage.text}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => router.push('/admin/posts')}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '更新中...' : '更新文章'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .vector-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e5e7eb;
        }

        .vector-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .vector-status.loading {
          color: #6b7280;
        }

        .vector-status.has-vectors {
          color: #059669;
        }

        .vector-status.has-vectors .vector-icon {
          width: 20px;
          height: 20px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .vector-status.no-vectors {
          color: #dc2626;
        }

        .vector-status.no-vectors .vector-icon {
          width: 20px;
          height: 20px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .vector-text small {
          color: #6b7280;
          font-size: 12px;
        }

        .vector-actions {
          display: flex;
          gap: 8px;
        }

        .btn-vector {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-vector:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-vector:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .btn-vector-delete {
          padding: 8px 16px;
          background: white;
          color: #dc2626;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-vector-delete:hover {
          background: #fef2f2;
          border-color: #dc2626;
        }

        .vector-message {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 13px;
        }

        .vector-message.success {
          background: #d1fae5;
          color: #065f46;
        }

        .vector-message.error {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </AdminLayout>
  );
};

export default EditPost;
