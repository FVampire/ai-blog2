import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import MarkdownEditor from '../../../components/MarkdownEditor';
import EnhancedImageUpload from '../../../components/EnhancedImageUpload';

interface Tag {
  id: number;
  name: string;
  slug: string;
}

const NewPost: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    tagIds: [] as number[],
  });

  useEffect(() => {
    loadTags();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug) {
      alert('标题和Slug不能为空');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('文章创建成功');
        router.push('/admin/posts');
      } else {
        alert(data.message || '创建失败');
      }
    } catch (error) {
      console.error('Create post error:', error);
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    if (!formData.slug) {
      setFormData({ ...formData, title, slug: generateSlug(title) });
    }
  };

  const toggleTag = (tagId: number) => {
    const tagIds = formData.tagIds.includes(tagId)
      ? formData.tagIds.filter(id => id !== tagId)
      : [...formData.tagIds, tagId];
    setFormData({ ...formData, tagIds });
  };

  return (
    <AdminLayout>
      <Head>
        <title>新建文章 - Blog Admin</title>
      </Head>

      <div className="post-editor-page">
        <div className="page-header">
          <h1 className="page-title">新建文章</h1>
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
                onChange={(e) => handleTitleChange(e.target.value)}
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
              {loading ? '创建中...' : '创建文章'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default NewPost;
