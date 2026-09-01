'use client';

import styles from '../preview.module.css';
import { article, latest, type ViewId } from '../mock';

export default function ArticleScreen({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  return (
    <article className={styles.articleWrap}>
      <div className={styles.crumb}>
        <button type="button" onClick={() => onNavigate('home')}>
          首页
        </button>
        {' / '}
        <button type="button" onClick={() => onNavigate('posts')}>
          文章
        </button>
        {' / '}
        <span>{article.tag}</span>
      </div>

      <div className={styles.kicker}>{article.tag}</div>
      <h1>{article.title}</h1>
      <div className={styles.byline}>
        <span>{article.author}</span>
        <time>{article.date}</time>
        <span>{article.minutes} 分钟</span>
      </div>

      <div className={styles.prose}>
        {article.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {'quote' in section && section.quote ? <blockquote className={styles.quote}>{section.quote}</blockquote> : null}
          </section>
        ))}
      </div>

      <div className={styles.articleTags}>
        <button type="button" className={styles.tag} onClick={() => onNavigate('tags')}>
          {article.tag}
        </button>
      </div>

      <section className={styles.morePosts}>
        <p className={styles.sectionLabel}>更多文章</p>
        {latest.slice(0, 3).map((post) => (
          <button key={post.id} type="button" className={styles.moreItem} onClick={() => onNavigate('posts')}>
            <strong>{post.title}</strong>
            <time>{post.date}</time>
          </button>
        ))}
      </section>

      <section className={styles.comments}>
        <p className={styles.sectionLabel}>评论 {article.comments.length}</p>
        {article.comments.map((comment) => (
          <div key={comment.name} className={styles.comment}>
            <header>
              <strong>{comment.name}</strong>
              <span>{comment.date}</span>
            </header>
            <p>{comment.body}</p>
          </div>
        ))}
        <div className={styles.commentForm}>
          <p>写下你的看法（预览，不会提交）</p>
          <button type="button">发表评论</button>
        </div>
      </section>
    </article>
  );
}
