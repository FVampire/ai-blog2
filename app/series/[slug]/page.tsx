import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import SafeImage from '../../../components/SafeImage';
import { formatDate } from '../../../lib/format';
import { SeriesRepository } from '../../../lib/repositories/SeriesRepository';
import { siteBaseUrl } from '../../../lib/site-url';
import styles from '../series.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const series = await SeriesRepository.getBySlug(slug);
    if (!series) return { title: '系列未找到' };
    const description = series.description || `阅读系列《${series.title}》`;
    const url = `${siteBaseUrl()}/series/${series.slug}`;
    return {
      title: series.title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'website',
        title: series.title,
        description,
        url,
        siteName: '五月的火',
        images: [{ url: series.coverUrl || '/og-default.png', alt: series.title }],
      },
    };
  } catch {
    return { title: '系列未找到' };
  }
}

export default async function SeriesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let series = null;
  try {
    series = await SeriesRepository.getBySlug(slug);
  } catch (error) {
    console.error('Failed to load series:', error);
  }
  if (!series) notFound();

  const published = series.posts.filter((post) => post.status === 'published');
  const cover = series.coverUrl || published[0]?.imageUrl || '';
  const percent = Math.round((published.length / Math.max(series.posts.length, 1)) * 100);

  return (
    <div className="site-shell">
      <Header />
      <main className={styles.detail}>
        <p className="index-path">
          <Link href="/series">系列</Link> / {series.title}
        </p>
        {cover && (
          <figure className={styles.hero}>
            <SafeImage src={cover} alt={series.title} width={1200} height={630} className={styles.heroImage} />
          </figure>
        )}
        <h1>{series.title}</h1>
        {series.description && <p className={styles.lead}>{series.description}</p>}
        <div className={styles.progressBlock}>
          <div>
            <strong>{published.length}</strong>
            <span> / {series.posts.length} 篇已发布</span>
          </div>
          <div className={styles.progressTrack}>
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
        <ol className={styles.toc}>
          {published.map((post, index) => (
            <li key={post.id}>
              <Link href={`/posts/${post.slug}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{post.title}</strong>
                  <p>{post.excerpt || '阅读这一篇'}</p>
                </div>
                <time>{post.publishedAt ? formatDate(post.publishedAt) : ''}</time>
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </div>
  );
}
