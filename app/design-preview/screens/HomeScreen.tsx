'use client';

import styles from '../preview.module.css';
import { about, featured, latest, tags, type ViewId } from '../mock';

function Sidebar({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  return (
    <aside>
      <div className={styles.sideBlock}>
        <p className={styles.sectionLabel}>关于</p>
        <h2>{about.name}</h2>
        <p>{about.bio[0]}</p>
        <button type="button" className={styles.more} onClick={() => onNavigate('about')}>
          更多介绍
        </button>
      </div>
      <div className={styles.sideBlock}>
        <p className={styles.sectionLabel}>标签</p>
        <div className={styles.tagList}>
          {tags.map((tag) => (
            <button key={tag.name} type="button" className={styles.tag} onClick={() => onNavigate('tags')}>
              {tag.name} {tag.count}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.sideBlock}>
        <p className={styles.sectionLabel}>搜索</p>
        <button type="button" className={styles.searchMock}>
          搜索文章…
        </button>
      </div>
    </aside>
  );
}

export default function HomeScreen({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  return (
    <div className={styles.layout}>
      <div>
        <article
          className={styles.featured}
          onClick={() => onNavigate('article')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') onNavigate('article');
          }}
          role="link"
          tabIndex={0}
        >
          <div className={`${styles.cover} ${styles[featured.cover]}`}>{featured.tag}</div>
          <div>
            <div className={styles.kicker}>主打文章</div>
            <h1 className={styles.featuredTitle}>{featured.title}</h1>
            <div className={styles.meta}>
              <time>{featured.date}</time>
              <span>{featured.minutes} 分钟</span>
              <span>{featured.tag}</span>
            </div>
            <p className={styles.excerpt}>{featured.excerpt}</p>
          </div>
        </article>

        <p className={styles.sectionLabel}>最新文章</p>
        <div className={styles.feed}>
          {latest.slice(0, 6).map((post) => (
            <button key={post.id} type="button" className={styles.post} onClick={() => onNavigate('article')}>
              <div className={styles.meta}>
                <time>{post.date}</time>
                <span>{post.tag}</span>
              </div>
              <span className={styles.postTitle}>{post.title}</span>
              <p className={styles.postExcerpt}>{post.excerpt}</p>
            </button>
          ))}
        </div>
        <button type="button" className={styles.more} onClick={() => onNavigate('posts')}>
          全部文章
        </button>
      </div>
      <Sidebar onNavigate={onNavigate} />
    </div>
  );
}
