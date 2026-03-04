import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BlogPostCard from '../../components/BlogPostCard';
import TagCloud from '../../components/TagCloud';
import AuthorBio from '../../components/AuthorBio';
import { query } from '../../lib/db';

interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  slug: string;
  image: string;
  tags: string[];
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

interface TagPageProps {
  tag: Tag | null;
  posts: Post[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
}

const TagPage: React.FC<TagPageProps> = ({ tag, posts, currentPage, totalPages }) => {
  const router = useRouter();

  if (!tag) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="card">
            <h1 className="section-title">标签未找到</h1>
            <p>请求的标签不存在。</p>
            <a href="/tags" style={{ color: '#FF6B6B', marginTop: '20px', display: 'inline-block' }}>
              查看所有标签
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePageChange = (page: number) => {
    router.push(`/tags/${tag.slug}?page=${page}`, undefined, { scroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }

    return pages;
  };

  return (
    <div>
      <Head>
        <title>{tag.name} - My Blog</title>
        <meta name="description" content={`浏览标签为 ${tag.name} 的所有文章`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <h1 className="section-title">
                标签: {tag.name}
                <span style={{
                  marginLeft: '12px',
                  fontSize: '18px',
                  color: '#6C757D',
                  fontWeight: 'normal',
                  fontStyle: 'normal'
                }}>
                  ({tag.post_count} 篇文章)
                </span>
              </h1>
              {posts.length > 0 ? (
                <>
                  {posts.map((post) => (
                    <BlogPostCard
                      key={post.id}
                      title={post.title}
                      date={post.date}
                      author={post.author}
                      excerpt={post.excerpt}
                      slug={post.slug}
                      image={post.image}
                      tags={post.tags}
                    />
                  ))}

                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <span className="pagination-arrow">←</span>
                      </button>

                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                        ) : (
                          <button
                            key={page}
                            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => handlePageChange(page as number)}
                          >
                            {page}
                          </button>
                        )
                      ))}

                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <span className="pagination-arrow">→</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <p>该标签下暂无文章</p>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar">
            <TagCloud />
            <AuthorBio />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  const page = parseInt(context.query.page as string) || 1;
  const postsPerPage = 4;
  const offset = (page - 1) * postsPerPage;

  try {
    // Fetch tag info
    const tagResult = await query(
      `SELECT
        t.id, t.name, t.slug,
        COUNT(pt.post_id) as post_count
       FROM tags t
       LEFT JOIN post_tags pt ON t.id = pt.tag_id
       LEFT JOIN posts p ON pt.post_id = p.id
       WHERE t.slug = $1 and p.status = 'published'
       GROUP BY t.id`,
      [slug]
    );

    const tagExists = await query(
      `SELECT EXISTS (
        SELECT 1
        FROM tags t
        WHERE t.slug = $1
      )`,
      [slug]
    );

    console.log('tagExists:', tagExists.rows);

    if (!tagExists.rows[0].exists) {
      return {
        props: {
          tag: null,
          posts: [],
          totalPosts: 0,
          currentPage: 1,
          totalPages: 0,
        },
      };
    }

     if (tagResult.rows.length === 0) {
      return {
        props: {
          tag: [],
          posts: [],
          totalPosts: 0,
          currentPage: 1,
          totalPages: 0,
        },
      };
    }

    const tag = tagResult.rows[0];

    // Fetch posts with this tag
    const postsResult = await query(
      `SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(
            t2.name
          ) FILTER (WHERE t2.name IS NOT NULL), '[]'
        ) as tags
       FROM posts p
       INNER JOIN post_tags pt ON p.id = pt.post_id
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN post_tags pt2 ON p.id = pt2.post_id
       LEFT JOIN tags t2 ON pt2.tag_id = t2.id
       WHERE pt.tag_id = $1 AND p.status = 'published'
       GROUP BY p.id, u.username
       ORDER BY p.published_at DESC
       LIMIT $2 OFFSET $3`,
      [tag.id, postsPerPage, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM posts p
       INNER JOIN post_tags pt ON p.id = pt.post_id
       WHERE pt.tag_id = $1 AND p.status = 'published'`,
      [tag.id]
    );

    const totalPosts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    // Format posts
    const posts: Post[] = postsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      date: new Date(row.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      author: row.author_name,
      excerpt: row.excerpt,
      slug: row.slug,
      image: row.image_url || '',
      tags: row.tags,
    }));

    return {
      props: {
        tag,
        posts,
        totalPosts,
        currentPage: page,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching tag page:', error);
    return {
      props: {
        tag: null,
        posts: [],
        totalPosts: 0,
        currentPage: 1,
        totalPages: 0,
      },
    };
  }
};

export default TagPage;
