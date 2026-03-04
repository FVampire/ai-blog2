import React, { useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import TableOfContents from '../../../../components/TableOfContents';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { query } from '../../../../lib/db';

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
  created_at: string;
  author_name: string;
  tags: Tag[];
}

interface PreviewPostProps {
  post: Post | null;
}

const PreviewPost: React.FC<PreviewPostProps> = ({ post }) => {
  // Handle the case where post is not found
  if (!post) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="card">
            <h1 className="section-title">文章未找到</h1>
            <p>请求的文章不存在。</p>
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
        <title>[预览] {post.title} - My Blog</title>
        <meta name="description" content={post.excerpt || `Preview ${post.title} on My Blog`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 预览提示条 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FF8C42',
        color: 'white',
        padding: '12px',
        textAlign: 'center',
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        🔍 预览模式 - 此内容未发布
      </div>

      <div style={{ marginTop: '48px' }}>
        <Header />

        <div className="container">
          <div className="content-wrapper">
            <div className="main-content">
              <div className="blog-section">
                <article className="card blog-card">
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
                        {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                      </span>
                      <span className="meta-text">作者: {post.author_name}</span>
                      <span className="meta-text">
                        <span className={`status-badge ${post.status === 'published' ? 'published' : 'draft'}`}>
                          {post.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </span>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="blog-tags">
                        {post.tags.map((tag, index) => (
                          <span
                            key={tag.id}
                            className={`blog-tag blog-tag-${(index % 3) + 1}`}
                            style={{ cursor: 'default' }}
                          >
                            {tag.name}
                          </span>
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
                  </div>
                </article>
              </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar">
              {/* Table of Contents */}
              <TableOfContents content={post.content} />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  try {
    // Fetch the post by ID (不限制状态，可以预览草稿)
    const postResult = await query(
      `SELECT
        p.id, p.title, p.slug, p.excerpt, p.content, p.image_url,
        p.status, p.views,
        TO_CHAR(p.published_at, 'YYYY-MM-DD HH24:MI:SS') as published_at,
        TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        u.username as author_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (postResult.rows.length === 0) {
      return {
        props: {
          post: null,
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

    return {
      props: {
        post,
      },
    };
  } catch (error) {
    console.error('Error fetching post preview:', error);
    return {
      props: {
        post: null,
      },
    };
  }
};

export default PreviewPost;
