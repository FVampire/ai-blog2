'use client';

import { useState } from 'react';

import styles from '../preview.module.css';
import { posts, tags, type ViewId } from '../mock';

export default function TagsScreen({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const [active, setActive] = useState(tags[0].name);
  const filtered = posts.filter((post) => post.tag === active);

  return (
    <div className={styles.tagPage}>
      <h1>标签</h1>
      <p className={styles.tagLead}>按主题浏览全部文章。</p>
      <div className={styles.tagCloud}>
        {tags.map((tag) => (
          <button
            key={tag.name}
            type="button"
            className={`${styles.tagChip} ${active === tag.name ? styles.tagChipOn : ''}`}
            onClick={() => setActive(tag.name)}
          >
            {tag.name} · {tag.count}
          </button>
        ))}
      </div>
      {filtered.map((post) => (
        <button key={post.id} type="button" className={styles.indexRow} onClick={() => onNavigate('article')}>
          <time>{post.date}</time>
          <div>
            <h2>{post.title}</h2>
            <p className={styles.postExcerpt}>{post.excerpt}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
