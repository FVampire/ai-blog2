'use client';

import React from 'react';

import { useRouter } from 'next/navigation';

import BlogPostCard from '../../components/BlogPostCard';

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

interface ArticlesContentProps {
  posts: Post[];
  currentPage: number;
  totalPages: number;
}

export default function ArticlesContent({ posts, currentPage, totalPages }: ArticlesContentProps) {
  const router = useRouter();

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
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

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 text-text-secondary">
        暂无文章
      </div>
    );
  }

  return (
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
  );
}
