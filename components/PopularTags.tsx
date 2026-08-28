'use client';

import React from 'react';

import Link from 'next/link';

import { useTags } from './useTags';

const PopularTags: React.FC = () => {
  const { tags, loading } = useTags();

  const topTags = [...tags].sort((a, b) => b.post_count - a.post_count).slice(0, 5);

  if (loading) {
    return (
      <div className="card">
        <h2 className="section-title">热门标签</h2>
        <p className="widget-placeholder">加载中...</p>
      </div>
    );
  }

  if (topTags.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="section-title">热门标签</h2>
      <ol className="popular-tags-list">
        {topTags.map((tag) => (
          <li key={tag.id} className="popular-tags-item">
            <Link href={`/tags/${tag.slug}`} className="popular-tags-link">
              {tag.name}
              <span className="popular-tags-count">({tag.post_count})</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default PopularTags;
