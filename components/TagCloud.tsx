'use client';

import React from 'react';

import Link from 'next/link';

import { useTags } from './useTags';

function adjustBrightness(color: string, percent: number): string {
  if (!color) return color;
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const TagCloud: React.FC = () => {
  const { tags, loading } = useTags();

  if (loading || tags.length === 0) {
    return (
      <div className="card">
        <h2 className="section-title">标签</h2>
        <div className="tags-container">
          <p className="widget-placeholder">{loading ? '加载中...' : '暂无标签'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title">标签</h2>
      <div className="tags-container">
        {tags.map((tag, index) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="tag tag-with-count no-underline cursor-pointer relative"
            style={{
              animationDelay: `${index * 0.1}s`,
              background: `linear-gradient(135deg, ${tag.color}, ${adjustBrightness(tag.color, 15)})`,
              boxShadow: `0 4px 15px ${tag.color}30`
            }}
          >
            {tag.name}
            {tag.post_count > 0 && (
              <span className="tag-count">
                {tag.post_count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TagCloud;
