import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ArticleTracker from "./ArticleTracker";
import BackToTop from "../../../components/BackToTop";
import CommentsSection from "../../../components/CommentsSection";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import SafeImage from "../../../components/SafeImage";
import TableOfContents from "../../../components/TableOfContents";
import { formatDate } from "../../../lib/format";
import { articleRehypePlugins } from "../../../lib/markdown/plugins";
import { rewriteMarkdownMediaUrls } from "../../../lib/media-url";
import { PostRepository } from "../../../lib/repositories/PostRepository";

const SITE_NAME = "五月的火";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const DEFAULT_OG_IMAGE = "/og-default.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await PostRepository.getPostBySlug(slug);

  if (!post) {
    return { title: "文章未找到" };
  }

  const description = post.excerpt || `阅读《${post.title}》`;
  const url = `${SITE_URL}/posts/${post.slug}`;
  const image = post.imageUrl || DEFAULT_OG_IMAGE;

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, alt: post.title }],
      publishedTime: new Date(post.publishedAt || post.createdAt).toISOString(),
      modifiedTime: new Date(post.updatedAt || post.createdAt).toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await PostRepository.getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const authorName = post.authorName || (await PostRepository.getAuthorName());
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
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.title,
    image: [post.imageUrl || `${SITE_URL}${DEFAULT_OG_IMAGE}`],
    datePublished: new Date(post.publishedAt || post.createdAt).toISOString(),
    dateModified: new Date(
      post.updatedAt || post.publishedAt || post.createdAt,
    ).toISOString(),
    author: { "@type": "Person", name: authorName },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/posts/${post.slug}`,
    },
  };

  return (
    <div className="site-shell article-page">
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
                <div className="blog-card-content">
                  <p className="article-breadcrumb">
                    <Link href="/articles">文章</Link>
                    {post.seriesSlug ? (
                      <>
                        {" / "}
                        <Link href={`/series/${post.seriesSlug}`}>{post.seriesTitle || "系列"}</Link>
                      </>
                    ) : (
                      <> / {post.category?.name || "笔记"}</>
                    )}
                    {" / "}
                    {post.title}
                  </p>
                  <h1 className="blog-title mb-4">{post.title}</h1>

                  {post.excerpt && (
                    <p className="article-lead">{post.excerpt}</p>
                  )}

                  <div className="blog-meta">
                    <span className="meta-text">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span className="meta-text">
                      {Math.max(
                        1,
                        Math.ceil(post.content.replace(/\s/g, "").length / 300),
                      )}{" "}
                      min
                    </span>
                    <span className="meta-text">
                      {post.content.replace(/\s/g, "").length} words
                    </span>
                  </div>

                  {post.tags.length > 0 && (
                    <div className="article-tags">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/tags/${tag.slug}`}
                          className="article-tag"
                          style={{
                            backgroundColor: `${tag.color || "#6C757D"}18`,
                            color: tag.color || "#6C757D",
                            borderColor: `${tag.color || "#6C757D"}40`,
                          }}
                        >
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {post.imageUrl && (
                    <figure className="blog-image-container">
                      <SafeImage
                        src={post.imageUrl}
                        alt={post.title}
                        width={1200}
                        height={630}
                        priority
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="blog-image"
                      />
                      <figcaption>图 1-1 cover.webp</figcaption>
                    </figure>
                  )}

                  <div className="markdown-preview mt-8">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={articleRehypePlugins}
                    >
                      {rewriteMarkdownMediaUrls(post.content)}
                    </ReactMarkdown>
                  </div>

                  {(prevPost || nextPost || post.seriesSlug) && (
                    <div
                      className={`post-navigation ${!prevPost || !nextPost ? "single-nav" : ""}`}
                    >
                      {post.seriesSlug && (
                        <Link href={`/series/${post.seriesSlug}`} className="nav-post" style={{ gridColumn: '1 / -1' }}>
                          <div className="nav-label">系列目录</div>
                          <div className="nav-title">{post.seriesTitle || "查看全部文章"}</div>
                        </Link>
                      )}
                      {prevPost && (
                        <Link
                          href={`/posts/${prevPost.slug}`}
                          className="nav-post prev"
                        >
                          <div className="nav-label">← 上一篇</div>
                          <div className="nav-title">{prevPost.title}</div>
                        </Link>
                      )}
                      {nextPost && (
                        <Link
                          href={`/posts/${nextPost.slug}`}
                          className="nav-post next"
                        >
                          <div className="nav-label">下一篇 →</div>
                          <div className="nav-title">{nextPost.title}</div>
                        </Link>
                      )}
                    </div>
                  )}

                  <CommentsSection postId={post.id} />
                </div>
              </article>

              {relatedPosts.length > 0 && (
                <section className="article-related" aria-labelledby="related-posts-title">
                  <div className="article-related-heading">
                    <div>
                      <span>RELATED NOTES</span>
                      <h2 id="related-posts-title">相关文章</h2>
                    </div>
                    <span>{String(relatedPosts.length).padStart(2, "0")} entries</span>
                  </div>
                  <div className="article-related-list">
                    {relatedPosts.map((relatedPost, index) => (
                      <Link key={relatedPost.id} href={`/posts/${relatedPost.slug}`}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{relatedPost.title}</strong>
                        <i>阅读文章 →</i>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <div className="sidebar">
            <TableOfContents content={post.content} />
          </div>
        </div>
      </div>

      <Footer />
      <BackToTop />
    </div>
  );
}
