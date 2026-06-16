'use client';

import React, { useEffect, useState, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import BlogPostCard from '../../components/BlogPostCard';
import Footer from '../../components/Footer';
import Header from '../../components/Header';

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

function ArticlesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1') || 1;
    setCurrentPage(page);

    fetch(`/api/posts?page=${page}&limit=6`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPosts(data.data);
          setTotalPages(data.pagination.totalPages);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch posts:', err);
        setLoading(false);
      });
  }, [searchParams]);

  const handlePageChange = (page: number) => {
    router.push(`/articles?page=${page}`);
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
      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <h1 className="section-title">All Articles</h1>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6C757D' }}>
                  加载中...
                </div>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6C757D' }}>
                  暂无文章
                </div>
              ) : (
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
              )}
            </div>
          </div>

          <div className="sidebar">
            <div className="card">
              <h2 className="section-title">Categories</h2>
              <ul style={{ paddingLeft: '20px' }}>
                <li style={{ marginBottom: '10px' }}><a href="#">Web Development</a></li>
                <li style={{ marginBottom: '10px' }}><a href="#">UI/UX Design</a></li>
                <li style={{ marginBottom: '10px' }}><a href="#">Backend</a></li>
                <li style={{ marginBottom: '10px' }}><a href="#">DevOps</a></li>
                <li><a href="#">Career</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>}>
      <ArticlesContent />
    </Suspense>
  );
}
