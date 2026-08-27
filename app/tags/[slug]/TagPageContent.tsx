'use client';

import { useRouter } from 'next/navigation';

import AuthorBio from '../../../components/AuthorBio.tailwind';
import BlogPostCard from '../../../components/BlogPostCard';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import TagCloud from '../../../components/TagCloud';

interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  slug: string;
  image: string;
  tags: Array<{ name: string; color: string; slug?: string }>;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

interface TagPageContentProps {
  tag: Tag;
  posts: Post[];
  currentPage: number;
  totalPages: number;
}

export default function TagPageContent({ tag, posts, currentPage, totalPages }: TagPageContentProps) {
  const router = useRouter();

  const handlePageChange = (page: number) => {
    router.push(`/tags/${tag.slug}?page=${page}`);
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

  return (
    <div>
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
}
