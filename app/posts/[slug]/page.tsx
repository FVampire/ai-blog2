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
import { PostRepository } from '../../../lib/repositories/PostRepository';
import ArticleTracker from './ArticleTracker';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await PostRepository.getPostBySlug(slug);
  if (post) {
    return {
      title: `${post.title} - 五月的火`,
      description: post.excerpt || `Read ${post.title} on 五月的火`,
    };
  }
  return { title: '文章未找到 - 五月的火' };
}

function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await PostRepository.getPostBySlug(slug);
  const authorName = post?.authorName || await PostRepository.getAuthorName();

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

  const relatedPosts = await PostRepository.getRelatedPosts(post.id);
  const { prevPost, nextPost } = await PostRepository.getAdjacentPosts(post.id);

  const trackerPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    author_name: authorName,
    tags: post.tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
  };

  return (
    <div>
      <ArticleTracker post={trackerPost} />

      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <article className="blog-card">
                {post.imageUrl && (
                  <div className="blog-image-container">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="blog-image"
                    />
                  </div>
                )}

                <div className="blog-card-content">
                  <h1 className="blog-title mb-4">{post.title}</h1>

                  <div className="blog-meta">
                    <span className="meta-text">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span className="meta-text">作者: {authorName}</span>
                    <span className="meta-text">👁️ {post.views} 次阅读</span>
                  </div>

                  {post.tags.length > 0 && (
                    <div className="article-tags">
                      {post.tags.map((tag) => (
                        <a
                          key={tag.id}
                          href={`/tags/${tag.slug}`}
                          className="article-tag"
                          style={{
                            backgroundColor: `${tag.color || '#6C757D'}18`,
                            color: tag.color || '#6C757D',
                            borderColor: `${tag.color || '#6C757D'}40`,
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
                  {relatedPosts.map((relatedPost) => (
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
