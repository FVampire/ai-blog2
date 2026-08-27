'use client';

import React, { useEffect, useState } from 'react';

interface Tag {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

const PopularTags: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch tags from API and sort by post count
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Sort by post_count and get top 5
          const topTags = data.data
            .sort((a: Tag, b: Tag) => b.post_count - a.post_count)
            .slice(0, 5);
          setTags(topTags);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch popular tags:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h2 className="section-title">Popular Tags</h2>
        <p style={{ color: '#6C757D', textAlign: 'center', fontSize: '14px' }}>加载中...</p>
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="section-title">Popular Tags</h2>
      <ol style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
        {tags.map((tag) => (
          <li key={tag.id} style={{ marginBottom: '10px' }}>
            <a
              href={`/tags/${tag.slug}`}
              style={{
                color: '#495057',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF6B6B'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#495057'}
            >
              {tag.name}
              <span style={{
                marginLeft: '8px',
                color: '#999',
                fontSize: '12px'
              }}>
                ({tag.post_count})
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default PopularTags;
