import React, { useEffect, useState } from 'react';

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  post_count: number;
}

const TagCloud: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch tags from API
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTags(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tags:', err);
        setLoading(false);
      });
  }, []);

  // 辅助函数：调整颜色亮度
  const adjustBrightness = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  if (loading) {
    return (
      <div className="card">
        <h2 className="section-title">Tags</h2>
        <div className="tags-container">
          <p style={{ color: '#6C757D', textAlign: 'center' }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="card">
        <h2 className="section-title">Tags</h2>
        <div className="tags-container">
          <p style={{ color: '#6C757D', textAlign: 'center' }}>暂无标签</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title">Tags</h2>
      <div className="tags-container">
        {tags.map((tag, index) => (          
          <a
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="tag tag-with-count"
            style={{
              textDecoration: 'none',
              cursor: 'pointer',
              position: 'relative',
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
          </a>
        ))}
      </div>
    </div>
  );
};

export default TagCloud;
