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
    <div className="card blog-card">
      {image && (
        <div className="blog-image-container">
          <Image src={image} alt={title} className="blog-image" width={400} height={250} style={{ objectFit: 'cover' }} />
        </div>
      )}
      <div className="blog-card-content">
        <h2 className="blog-title">{title}</h2>
        <div className="blog-meta">
          <span className="meta-text">{date}</span>
          <span className="meta-text">by {author}</span>
        </div>
        <p className="blog-excerpt">{excerpt}</p>
        {tags && tags.length > 0 && (
          <div className="blog-tags">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="blog-tag"
                style={{
                  background: `linear-gradient(135deg, ${tag.color}, ${adjustBrightness(tag.color, 20)})`,
                  boxShadow: `0 2px 8px ${tag.color}30`
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <a href={`/posts/${slug}`} className="read-more">Read more</a>
      </div>
    </div>
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