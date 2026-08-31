import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import BackToTop from '../../../components/BackToTop';
import CommentsSection from '../../../components/CommentsSection';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import TableOfContents from '../../../components/TableOfContents';
import { formatDate } from '../../../lib/format';
import { articleRehypePlugins } from '../../../lib/markdown/plugins';
import { PostRepository } from '../../../lib/repositories/PostRepository';
import ArticleTracker from './ArticleTracker';

const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const DEFAULT_OG_IMAGE = '/og-default.png';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await PostRepository.getPostBySlug(slug);

  if (!post) {
    return { title: '文章未找到' };
  }

  const description = post.excerpt || `阅读《${post.title}》`;
  const url = `${SITE_URL}/posts/${post.slug}`;
  const image = post.imageUrl || DEFAULT_OG_IMAGE;

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, alt: post.title }],
      publishedTime: new Date(post.publishedAt || post.createdAt).toISOString(),
      modifiedTime: new Date(post.updatedAt || post.createdAt).toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [image],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await PostRepository.getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const authorName = post.authorName || await PostRepository.getAuthorName();
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    image: [post.imageUrl || `${SITE_URL}${DEFAULT_OG_IMAGE}`],
    datePublished: new Date(post.publishedAt || post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt || post.publishedAt || post.createdAt).toISOString(),
    author: { '@type': 'Person', name: authorName },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/posts/${post.slug}` },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ArticleTracker post={trackerPost} />

      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <article className="blog-card">
                {post.imageUrl && (
                  <div className="blog-image-container">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      width={1200}
                      height={630}
                      priority
                      sizes="(max-width: 768px) 100vw, 760px"
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
                        <Link
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
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="markdown-preview mt-8">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={articleRehypePlugins}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </div>

                  {(prevPost || nextPost) && (
                    <div className={`post-navigation ${!prevPost || !nextPost ? 'single-nav' : ''}`}>
                      {prevPost && (
                        <Link href={`/posts/${prevPost.slug}`} className="nav-post prev">
                          <div className="nav-label">← 上一篇</div>
                          <div className="nav-title">{prevPost.title}</div>
                        </Link>
                      )}
                      {nextPost && (
                        <Link href={`/posts/${nextPost.slug}`} className="nav-post next">
                          <div className="nav-label">下一篇 →</div>
                          <div className="nav-title">{nextPost.title}</div>
                        </Link>
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
                    <Link
                      key={relatedPost.id}
                      href={`/posts/${relatedPost.slug}`}
                      className="text-sm text-gray-600 hover:text-warm-coral transition-colors duration-300"
                    >
                      {relatedPost.title}
                    </Link>
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
