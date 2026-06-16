import Image from 'next/image';
import React from 'react';

interface BlogPostCardProps {
  title: string;
  date: string;
  author: string;
  excerpt: string;
  slug: string;
  image?: string;
  tags?: Array<{ name: string; color: string }>;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ title, date, author, excerpt, slug, image, tags }) => {
  return (
    <article className="blog-card-modern">
      {image && (
        <a href={`/posts/${slug}`} className="blog-card-image-link">
          <div className="blog-card-image-wrapper">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="blog-card-image"
              unoptimized
            />
          </div>
        </a>
      )}
      <div className="blog-card-body">
        {tags && tags.length > 0 && (
          <div className="blog-card-tags">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="blog-card-tag"
                style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <h2 className="blog-card-title">
          <a href={`/posts/${slug}`}>{title}</a>
        </h2>
        <p className="blog-card-excerpt">{excerpt}</p>
        <div className="blog-card-footer">
          <span className="blog-card-date">{date}</span>
          <a href={`/posts/${slug}`} className="blog-card-readmore">
            阅读更多
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
};

// 辅助函数：调整颜色亮度
function adjustBrightness(color: string, percent: number): string {
  if (!color) return color;
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default BlogPostCard;