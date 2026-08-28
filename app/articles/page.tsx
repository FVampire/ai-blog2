import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ArticlesContent from './ArticlesContent';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { formatDate } from '../../lib/format';
import { PostRepository } from '../../lib/repositories/PostRepository';
import { TagRepository } from '../../lib/repositories/TagRepository';

export const dynamic = 'force-dynamic';

const PAGE_TITLE = '全部文章';
const PAGE_DESCRIPTION = '浏览站点上的全部已发布文章。';
const SITE_NAME = '五月的火';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

interface Post {
  id: number;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  slug: string;
  image: string;
  tags: Array<{ name: string; color: string; slug?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: `${SITE_URL}/articles` },
    openGraph: {
      type: 'website',
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${SITE_URL}/articles`,
      siteName: SITE_NAME,
      locale: 'zh_CN',
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: PAGE_TITLE }],
    },
    twitter: {
      card: 'summary_large_image',
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      images: ['/og-default.png'],
    },
  };
}

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const currentPage = parseInt((await searchParams).page || '1') || 1;
  const postsPerPage = 6;

  let posts: Post[] = [];
  let totalPages = 0;
  let postsFailed = false;

  try {
    const result = await PostRepository.getPublicPosts({ page: currentPage, limit: postsPerPage });
    const authorName = await PostRepository.getAuthorName();

    totalPages = result.totalPages;
    posts = result.data.map((row) => ({
      id: row.id,
      title: row.title,
      date: formatDate(row.publishedAt),
      author: row.authorName || authorName,
      excerpt: row.excerpt,
      slug: row.slug,
      image: row.imageUrl || '',
      tags: Array.isArray(row.tags)
        ? (row.tags as Array<{ name: string; slug?: string; color?: string }>).map((t) => ({
            name: t.name,
            slug: t.slug,
            color: t.color || '#6C757D',
          }))
        : [],
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    postsFailed = true;
  }

  let tags: Array<{ id: number; name: string; slug: string; postCount: number }> = [];
  try {
    tags = (await TagRepository.getAllTagsWithCount()).filter((tag) => tag.postCount > 0);
  } catch (error) {
    console.error('Error fetching tags:', error);
  }

  return (
    <div>
      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <h1 className="section-title">{PAGE_TITLE}</h1>

              {postsFailed ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>
                    文章列表暂时无法加载
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    数据服务可能正在维护。请稍后刷新页面重试。
                  </p>
                </div>
              ) : (
                <ArticlesContent posts={posts} currentPage={currentPage} totalPages={totalPages} />
              )}
            </div>
          </div>

          <div className="sidebar">
            <div className="card">
              <h2 className="section-title">标签</h2>
              {tags.length === 0 ? (
                <p className="text-center py-3 text-text-secondary">暂无标签</p>
              ) : (
                <ul className="pl-5">
                  {tags.map((tag) => (
                    <li key={tag.id} className="mb-2.5">
                      <Link href={`/tags/${tag.slug}`} className="hover:text-warm-orange transition-colors">
                        {tag.name}
                      </Link>
                      <span className="ml-2 text-gray-400 text-xs">
                        ({tag.postCount})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
