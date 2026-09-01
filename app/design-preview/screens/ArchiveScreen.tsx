'use client';

import styles from '../preview.module.css';
import { posts, type ViewId } from '../mock';

export default function PostsScreen({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  return (
    <div className={styles.layout}>
      <div>
        <div className={styles.indexHead}>
          <h1>文章</h1>
          <span>{posts.length} 篇</span>
        </div>
        {posts.map((post) => (
          <button key={post.id} type="button" className={styles.indexRow} onClick={() => onNavigate('article')}>
            <time>{post.date}</time>
            <div>
              <div className={styles.meta}>
                <span>{post.tag}</span>
                <span>{post.minutes} 分钟</span>
              </div>
              <h2>{post.title}</h2>
              <p className={styles.postExcerpt}>{post.excerpt}</p>
            </div>
          </button>
        ))}
      </div>
      <aside>
        <div className={styles.sideBlock}>
          <p className={styles.sectionLabel}>按年</p>
          <p>2026 · 6 篇</p>
          <p>2025 · 2 篇</p>
        </div>
      </aside>
    </div>
  );
}
