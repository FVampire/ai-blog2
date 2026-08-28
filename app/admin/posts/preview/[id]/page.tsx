import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Footer from '../../../../../components/Footer';
import Header from '../../../../../components/Header';
import TableOfContents from '../../../../../components/TableOfContents';
import { requireAdminPage } from '../../../../../lib/auth-page';
import { query } from '../../../../../lib/db';
import { articleRehypePlugins } from '../../../../../lib/markdown/plugins';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  try {
    const result = await query(`SELECT p.title, p.excerpt FROM posts p WHERE p.id = $1`, [(await params).id]);
    if (result.rows.length > 0) {
      return {
        title: `[预览] ${result.rows[0].title} - 五月的火`,
        description: result.rows[0].excerpt || `Preview`,
        robots: { index: false, follow: false },
      };
    }
  } catch {
    // 忽略元数据生成错误
  }
  return { title: '文章预览 - 五月的火', robots: { index: false, follow: false } };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function PreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  let post: any = null;

  try {
    const postResult = await query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.image_url, p.status, p.views,
        TO_CHAR(p.published_at, 'YYYY-MM-DD HH24:MI:SS') as published_at,
        TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        u.username as author_name
       FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.id = $1`, [id]
    );
    if (postResult.rows.length > 0) {
      post = postResult.rows[0];
      const tagsResult = await query(
        `SELECT t.id, t.name, t.slug FROM tags t INNER JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = $1 ORDER BY t.name ASC`, [post.id]
      );
      post.tags = tagsResult.rows;
    }
  } catch (error) { console.error('Error fetching post preview:', error); }

  if (!post) {
    return (
      <div>
        <Header />
        <div className="container"><div className="card"><h1 className="section-title">文章未找到</h1><p>请求的文章不存在。</p></div></div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: '#FF8C42', color: 'white', padding: '12px', textAlign: 'center', fontWeight: 600, zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        🔍 预览模式 - 此内容未发布
      </div>
      <div style={{ marginTop: '48px' }}>
        <Header />
        <div className="container">
          <div className="content-wrapper">
            <div className="main-content">
              <div className="blog-section">
                <article className="card blog-card">
                  {post.image_url && (<div className="blog-image-container"><img src={post.image_url} alt={post.title} className="blog-image" /></div>)}
                  <div className="blog-card-content">
                    <h1 className="blog-title" style={{ marginBottom: '16px' }}>{post.title}</h1>
                    <div className="blog-meta">
                      <span className="meta-text">{post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}</span>
                      <span className="meta-text">作者: {post.author_name}</span>
                      <span className="meta-text">
                        <span className={`status-badge ${post.status === 'published' ? 'published' : 'draft'}`}>{post.status === 'published' ? '已发布' : '草稿'}</span>
                      </span>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="blog-tags">
                        {post.tags.map((tag: any, index: number) => (
                          <span key={tag.id} className={`blog-tag blog-tag-${(index % 3) + 1}`} style={{ cursor: 'default' }}>{tag.name}</span>
                        ))}
                      </div>
                    )}
                    <div className="markdown-preview" style={{ marginTop: '32px' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={articleRehypePlugins}>{post.content}</ReactMarkdown>
                    </div>
                  </div>
                </article>
              </div>
            </div>
            <div className="sidebar"><TableOfContents content={post.content} /></div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
