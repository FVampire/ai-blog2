import React, { useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TableOfContents from '../../components/TableOfContents';
import BackToTop from '../../components/BackToTop';
import CommentsSection from '../../components/CommentsSection';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { query } from '../../lib/db';
import { useArticle } from '../../contexts/ArticleContext';

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

interface BlogPostProps {
  post: Post | null;
  relatedPosts: Post[];
  prevPost: NavPost | null;
  nextPost: NavPost | null;
}

const BlogPost: React.FC<BlogPostProps> = ({ post, relatedPosts, prevPost, nextPost }) => {
  const { setArticle } = useArticle();

  // Set article context for AI assistant
  useEffect(() => {
    if (post) {
      setArticle({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        author_name: post.author_name,
        tags: post.tags,
      });
    }

    // Clean up article context when leaving the page
    return () => {
      setArticle(null);
    };
  }, [post, setArticle]);

  // Track view when post loads
  useEffect(() => {
    if (post && post.id) {
      // Call track-view API
      fetch('/api/posts/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log(`View tracked for post ${post.id}, total views: ${data.data.views}`);
          }
        })
        .catch(err => {
          console.error('Failed to track view:', err);
        });
    }
  }, [post?.id]);

  // Handle the case where post is not found
  if (!post) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="card">
            <h1 className="section-title">文章未找到</h1>
            <p>请求的文章不存在或已被删除。</p>
            <a href="/" style={{ color: '#FF6B6B', marginTop: '20px', display: 'inline-block' }}>
              返回首页
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <Head>
        <title>{post.title} - My Blog</title>
        <meta name="description" content={post.excerpt || `Read ${post.title} on My Blog`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <article className="blog-card">
                {/* Cover Image */}
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
                  {/* Title */}
                  <h1 className="blog-title" style={{ marginBottom: '16px' }}>
                    {post.title}
                  </h1>

                  {/* Meta Info */}
                  <div className="blog-meta">
                    <span className="meta-text">
                      {formatDate(post.published_at)}
                    </span>
                    <span className="meta-text">作者: {post.author_name}</span>
                    <span className="meta-text">👁️ {post.views} 次阅读</span>
                  </div>

                  {/* Tags */}
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

                  {/* Content - Markdown Rendered */}
                  <div className="markdown-preview" style={{ marginTop: '32px' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </div>

                  {/* Prev/Next Navigation */}
                  {(prevPost || nextPost) && (
                    <div className={`post-navigation ${!prevPost || !nextPost ? 'single-nav' : ''}`}>
                      {prevPost && (
                        <a href={`/posts/${prevPost.slug}`} className="nav-post prev">
                          <div className="nav-label">
                            ← 上一篇
                          </div>
                          <div className="nav-title">{prevPost.title}</div>
                        </a>
                      )}
                      {nextPost && (
                        <a href={`/posts/${nextPost.slug}`} className="nav-post next">
                          <div className="nav-label">
                            下一篇 →
                          </div>
                          <div className="nav-title">{nextPost.title}</div>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Comments Section */}
                  <CommentsSection postId={post.id} />
                </div>
              </article>
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* Table of Contents */}
            <TableOfContents content={post.content} />

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="card">
                <h2 className="section-title">相关文章</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {relatedPosts.map(relatedPost => (
                    <a
                      key={relatedPost.id}
                      href={`/posts/${relatedPost.slug}`}
                      style={{
                        color: '#495057',
                        fontSize: '14px',
                        transition: 'color 0.3s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#FF6B6B'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#495057'}
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

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  try {
    // Fetch the post by slug
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

    if (postResult.rows.length === 0) {
      return {
        props: {
          post: null,
          relatedPosts: [],
          prevPost: null,
          nextPost: null,
        },
      };
    }

    const post = postResult.rows[0];


    // Fetch tags for this post
    const tagsResult = await query(
      `SELECT t.id, t.name, t.slug
       FROM tags t
       INNER JOIN post_tags pt ON t.id = pt.tag_id
       WHERE pt.post_id = $1
       ORDER BY t.name ASC`,
      [post.id]
    );

    post.tags = tagsResult.rows;

    // Fetch related posts (same tags, excluding current post)
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

    // Fetch previous post
    let prevPost = null;
    if (post.prev_post_id) {
      const prevResult = await query(
        `SELECT id, title, slug FROM posts WHERE id = $1 AND status = 'published'`,
        [post.prev_post_id]
      );
      if (prevResult.rows.length > 0) {
        prevPost = prevResult.rows[0];
      }
    }

    // Fetch next post
    let nextPost = null;
    if (post.next_post_id) {
      const nextResult = await query(
        `SELECT id, title, slug FROM posts WHERE id = $1 AND status = 'published'`,
        [post.next_post_id]
      );
      if (nextResult.rows.length > 0) {
        nextPost = nextResult.rows[0];
      }
    }

    return {
      props: {
        post,
        relatedPosts: relatedPostsResult.rows,
        prevPost,
        nextPost,
      },
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return {
      props: {
        post: null,
        relatedPosts: [],
        prevPost: null,
        nextPost: null,
      },
    };
  }
};

export default BlogPost;
