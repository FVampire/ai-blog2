import Link from 'next/link';
import type { Metadata } from 'next';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { formatDate } from '../../lib/format';
import { SeriesRepository } from '../../lib/repositories/SeriesRepository';
import { siteBaseUrl } from '../../lib/site-url';
import styles from './series.module.css';

export const dynamic = 'force-dynamic';

const PAGE_TITLE = '文章系列';
const PAGE_DESCRIPTION = '按阅读顺序整理的文章目录。';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${siteBaseUrl()}/series` },
  openGraph: {
    type: 'website',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${siteBaseUrl()}/series`,
    siteName: '五月的火',
    locale: 'zh_CN',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: PAGE_TITLE }],
  },
};

export default async function SeriesIndexPage() {
  let series: Awaited<ReturnType<typeof SeriesRepository.listPublic>> = [];
  try {
    series = await SeriesRepository.listPublic();
  } catch (error) {
    console.error('Failed to load series:', error);
  }

  return (
    <div className="site-shell">
      <Header />
      <main className="archive-layout">
        <section className="archive-main">
          <p className="index-path">系列 /</p>
          <h1>文章系列</h1>
          <p className="archive-count">{series.length} series · ordered reading</p>
          {series.length === 0 ? (
            <div className="index-empty">还没有公开系列。把两篇以上文章编成系列后会出现在这里。</div>
          ) : (
            <div className={styles.list}>
              {series.map((item) => (
                <Link key={item.id} href={`/series/${item.slug}`} className={styles.card}>
                  <div className={styles.cover} style={item.coverUrl ? { backgroundImage: `url(${item.coverUrl})` } : undefined} />
                  <div className={styles.body}>
                    <span className={styles.kicker}>SERIES</span>
                    <h2>{item.title}</h2>
                    <p>{item.description || '按顺序阅读这个系列。'}</p>
                    <div className={styles.meta}>
                      <span>{item.publishedCount} / {item.totalCount} 篇已发布</span>
                      {item.posts[0]?.publishedAt && <time>{formatDate(item.posts[0].publishedAt)}</time>}
                    </div>
                    <div className={styles.progressTrack} aria-hidden="true">
                      <span style={{ width: `${Math.round((item.publishedCount / Math.max(item.totalCount, 1)) * 100)}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
