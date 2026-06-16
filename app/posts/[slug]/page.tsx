import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import BackToTop from '../../../components/BackToTop';
import CommentsSection from '../../../components/CommentsSection';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import TableOfContents from '../../../components/TableOfContents';
import { query } from '../../../lib/db';
import ArticleTracker from './ArticleTracker';

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  status: string;
  views: number;
  published_at: string;
  author_name: string;
  tags: Tag[];
  prev_post_id?: number;
  next_post_id?: number;
}

interface NavPost {
  id: number;
  title: string;
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const result = await query(
      `SELECT p.title, p.excerpt FROM posts p WHERE p.slug = $1 AND p.status = 'published'`,
      [slug]
    );
    if (result.rows.length > 0) {
      return {
        title: `${result.rows[0].title} - 五月的火`,
        description: result.rows[0].excerpt || `Read ${result.rows[0].title} on 五月的火`,
      };
    }
  } catch {}
  return { title: '文章未找到 - 五月的火' };
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post: Post | null = null;
  let relatedPosts: Post[] = [];
  let prevPost: NavPost | null = null;
  let nextPost: NavPost | null = null;

  try {
    const postResult = await query(
      `SELECT
        p.id, p.title, p.slug, p.excerpt, p.content, p.image_url,
        p.status, p.views, p.prev_post_id, p.next_post_id,
        TO_CHAR(p.published_at, 'YYYY-MM-DD HH24:MI:SS') as published_at,
        TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        u.username as author_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.slug = $1 AND p.status = 'published'`,
      [slug]
    );

    if (postResult.rows.length > 0) {
      post = postResult.rows[0];

      const tagsResult = await query(
        `SELECT t.id, t.name, t.slug
         FROM tags t
         INNER JOIN post_tags pt ON t.id = pt.tag_id
         WHERE pt.post_id = $1
         ORDER BY t.name ASC`,
        [post.id]
      );
      post.tags = tagsResult.rows;

      const relatedPostsResult = await query(
        `SELECT DISTINCT p.id, p.title, p.slug,
         EXTRACT(EPOCH FROM p.published_at)::INTEGER as published_at
         FROM posts p
         INNER JOIN post_tags pt ON p.id = pt.post_id
         WHERE pt.tag_id IN (
           SELECT tag_id FROM post_tags WHERE post_id = $1
         )
         AND p.id != $1
         AND p.status = 'published'
         ORDER BY published_at DESC
         LIMIT 5`,
        [post.id]
      );
      relatedPosts = relatedPostsResult.rows;

      if (post.prev_post_id) {
        const prevResult = await query(
          `SELECT id, title, slug FROM posts WHERE id = $1 AND status = 'published'`,
          [post.prev_post_id]
        );
        if (prevResult.rows.length > 0) prevPost = prevResult.rows[0];
      }

      if (post.next_post_id) {
        const nextResult = await query(
          `SELECT id, title, slug FROM posts WHERE id = $1 AND status = 'published'`,
          [post.next_post_id]
        );
        if (nextResult.rows.length > 0) nextPost = nextResult.rows[0];
      }
    }
  } catch (error) {
    console.error('Error fetching post:', error);
  }

  if (!post) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="card">
            <h1 className="section-title">文章未找到</h1>
            <p>请求的文章不存在或已被删除。</p>
            <a href="/" className="inline-block mt-5 text-warm-coral hover:text-warm-orange transition-colors">
              返回首页
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <ArticleTracker post={post} />

      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <article className="blog-card">
                {post.image_url && (
                  <div className="blog-image-container">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="blog-image"
                    />
                  </div>
                )}

                <div className="blog-card-content">
                  <h1 className="blog-title mb-4">
                    {post.title}
                  </h1>

                  <div className="blog-meta">
                    <span className="meta-text">
                      {formatDate(post.published_at)}
                    </span>
                    <span className="meta-text">作者: {post.author_name}</span>
                    <span className="meta-text">👁️ {post.views} 次阅读</span>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="blog-tags">
                      {post.tags.map((tag, index) => (
                        <a
                          key={tag.id}
                          href={`/tags/${tag.slug}`}
                          className={`blog-tag blog-tag-${(index % 3) + 1}`}
                          style={{
                            textDecoration: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {tag.name}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="markdown-preview mt-8">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </div>

                  {(prevPost || nextPost) && (
                    <div className={`post-navigation ${!prevPost || !nextPost ? 'single-nav' : ''}`}>
                      {prevPost && (
                        <a href={`/posts/${prevPost.slug}`} className="nav-post prev">
                          <div className="nav-label">← 上一篇</div>
                          <div className="nav-title">{prevPost.title}</div>
                        </a>
                      )}
                      {nextPost && (
                        <a href={`/posts/${nextPost.slug}`} className="nav-post next">
                          <div className="nav-label">下一篇 →</div>
                          <div className="nav-title">{nextPost.title}</div>
                        </a>
                      )}
                    </div>
                  )}

                  <CommentsSection postId={post.id} />
                </div>
              </article>
            </div>
          </div>

          <div className="sidebar">
            <TableOfContents content={post.content} />

            {relatedPosts.length > 0 && (
              <div className="card">
                <h2 className="section-title">相关文章</h2>
                <div className="flex flex-col gap-3">
                  {relatedPosts.map(relatedPost => (
                    <a
                      key={relatedPost.id}
                      href={`/posts/${relatedPost.slug}`}
                      className="text-sm text-gray-600 hover:text-warm-coral transition-colors duration-300"
                    >
                      {relatedPost.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <BackToTop />
    </div>
  );
}
