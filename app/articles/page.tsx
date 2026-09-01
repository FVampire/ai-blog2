import React from 'react';

import Link from 'next/link';

import type { Metadata } from 'next';

import ArticlesContent from './ArticlesContent';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import TagCloud from '../../components/TagCloud';
import { formatDate } from '../../lib/format';
import { PostCategoryRepository } from '../../lib/repositories/PostCategoryRepository';
import { PostRepository } from '../../lib/repositories/PostRepository';

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
  category?: { name: string; slug: string; color: string };
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
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1') || 1;
  const categorySlug = params.category?.trim() || undefined;
  const postsPerPage = 6;

  let posts: Post[] = [];
  let totalPages = 0;
  let postsFailed = false;

  try {
    const result = await PostRepository.getPublicPosts({
      page: currentPage,
      limit: postsPerPage,
      category: categorySlug,
    });
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
      category: row.category ? {
        name: row.category.name,
        slug: row.category.slug,
        color: row.category.color,
      } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    postsFailed = true;
  }

  let categories: Awaited<ReturnType<typeof PostCategoryRepository.getAllWithPostCount>> = [];
  try {
    categories = (await PostCategoryRepository.getAllWithPostCount()).filter((category) => category.postCount > 0);
  } catch (error) {
    console.error('Error fetching post categories:', error);
  }

  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const allPublishedCount = categories.reduce((sum, category) => sum + category.postCount, 0);

  return (
    <div>
      <Header />

      <div className="articles-hero">
        <div className="container articles-hero-inner">
          <div>
            <span className="section-eyebrow">ARTICLE LIBRARY</span>
            <h1>{activeCategory?.name || PAGE_TITLE}</h1>
            <p>{activeCategory?.description || '按专栏回看所有开发记录、技术笔记与实践复盘。'}</p>
          </div>
          <div className="articles-hero-count">
            <strong>{activeCategory ? activeCategory.postCount : allPublishedCount}</strong>
            <span>篇文章</span>
          </div>
        </div>
      </div>

      <div className="container articles-container">
        <div className="content-wrapper articles-layout">
          <div className="main-content">
            <div className="blog-section">
              <div className="articles-list-heading">
                <h2>{activeCategory ? `${activeCategory.name} · 全部文章` : '按时间浏览'}</h2>
                <span>第 {currentPage} / {Math.max(totalPages, 1)} 页</span>
              </div>

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
                <ArticlesContent
                  posts={posts}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  categorySlug={categorySlug}
                />
              )}
            </div>
          </div>

          <div className="sidebar">
            <div className="card category-directory">
              <span className="section-eyebrow">COLUMNS</span>
              <h2 className="section-title">文章专栏</h2>
              {categories.length === 0 ? (
                <p className="text-center py-3 text-text-secondary">暂无专栏</p>
              ) : (
                <nav aria-label="按专栏筛选文章">
                  <Link href="/articles" className={!categorySlug ? 'category-directory-item active' : 'category-directory-item'}>
                    <span className="category-directory-dot" style={{ background: '#FF8C42' }} />
                    <span className="category-directory-name">全部文章</span>
                    <strong>{allPublishedCount}</strong>
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/articles?category=${category.slug}`}
                      className={category.slug === categorySlug ? 'category-directory-item active' : 'category-directory-item'}
                    >
                      <span className="category-directory-dot" style={{ background: category.color }} />
                      <span className="category-directory-name">{category.name}</span>
                      <strong>{category.postCount}</strong>
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            <TagCloud />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
