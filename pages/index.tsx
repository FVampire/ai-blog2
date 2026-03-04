import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BlogPostCard from '../components/BlogPostCard';
import TagCloud from '../components/TagCloud';
import AuthorBio from '../components/AuthorBio';
import SearchWidget from '../components/SearchWidget';
import { query } from '../lib/db';
import { useRouter } from 'next/router';

interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  slug: string;
  image: string;
  tags: Array<{ name: string; color: string }>;
}

interface HomePageProps {
  posts: Post[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
}

const HomePage: React.FC<HomePageProps> = ({ posts, currentPage, totalPages }) => {
  const router = useRouter();

  const handlePageChange = (page: number) => {
    // 更新URL参数并刷新页面
    router.push(`/?page=${page}`, undefined, { scroll: true });
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
        <title>My Blog</title>
        <meta name="description" content="A blog about technology, design, and development" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <h1 className="section-title">Latest Articles</h1>
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
                </>
              ) : (
                <div className="empty-state">
                  <p>暂无文章</p>
                </div>
              )}
            </div>
          </div>

          <div className="sidebar">
            <SearchWidget />
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
  try {
    console.log('🔵 [HomePage] Starting database query...');
    const page = parseInt(context.query.page as string) || 1;
    const postsPerPage = 4;
    const offset = (page - 1) * postsPerPage;

    console.log(`📄 [HomePage] Fetching page ${page}, offset ${offset}`);

    // 查询已发布的文章
    const result = await query(
      `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(
            json_build_object('name', t.name, 'color', t.color)
          ) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = 'published'
      GROUP BY p.id, u.username
      ORDER BY p.published_at DESC
      LIMIT $1 OFFSET $2
      `,
      [postsPerPage, offset]
    );

    // 获取总数
    const countResult = await query(
      'SELECT COUNT(*) FROM posts WHERE status = $1',
      ['published']
    );

    const totalPosts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    // 格式化数据
    const posts: Post[] = result.rows.map(row => ({
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
        posts,
        totalPosts,
        currentPage: page,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching posts:', error);

    // 返回空数据以防止错误
    return {
      props: {
        posts: [],
        totalPosts: 0,
        currentPage: 1,
        totalPages: 0,
      },
    };
  }
};

export default HomePage;
