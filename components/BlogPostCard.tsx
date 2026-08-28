import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { formatDate } from '@/lib/format';

interface BlogPostCardProps {
  title: string;
  date: string;
  author: string;
  excerpt: string;
  slug: string;
  image?: string;
  tags?: Array<{ name: string; color: string; slug?: string }>;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ title, date, author, excerpt, slug, image, tags }) => {
  const postHref = `/posts/${slug}`;

  return (
    <article className="blog-card-modern">
      {image && (
        <Link href={postHref} className="blog-card-image-link">
          <div className="blog-card-image-wrapper">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="blog-card-image"
            />
          </div>
        </Link>
      )}
      <div className="blog-card-body">
        {tags && tags.length > 0 && (
          <div className="blog-card-tags">
            {tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.slug || tag.name}
                href={tag.slug ? `/tags/${tag.slug}` : '/tags'}
                className="blog-card-tag"
                style={{
                  backgroundColor: `${tag.color}18`,
                  color: tag.color,
                  border: `1px solid ${tag.color}35`,
                }}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
        <h2 className="blog-card-title">
          <Link href={postHref}>{title}</Link>
        </h2>
        <p className="blog-card-excerpt">{excerpt}</p>
        <div className="blog-card-footer">
          <div className="blog-card-meta">
            <span className="blog-card-date">{formatDate(date)}</span>
            {author && <span className="blog-card-author">{author}</span>}
          </div>
          <Link href={postHref} className="blog-card-readmore">
            阅读更多
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogPostCard;
