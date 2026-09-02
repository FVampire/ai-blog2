import React from "react";

import Link from "next/link";

import type { Metadata } from "next";

import ArticlesContent from "./ArticlesContent";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import TagCloud from "../../components/TagCloud";
import { formatDate } from "../../lib/format";
import { PostCategoryRepository } from "../../lib/repositories/PostCategoryRepository";
import { PostRepository } from "../../lib/repositories/PostRepository";

export const dynamic = "force-dynamic";

const PAGE_TITLE = "全部文章";
const PAGE_DESCRIPTION = "浏览站点上的全部已发布文章。";
const SITE_NAME = "五月的火";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

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
      type: "website",
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${SITE_URL}/articles`,
      siteName: SITE_NAME,
      locale: "zh_CN",
      images: [
        { url: "/og-default.png", width: 1200, height: 630, alt: PAGE_TITLE },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      images: ["/og-default.png"],
    },
  };
}

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function ArticlesPage({
  searchParams,
}: ArticlesPageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1") || 1;
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
      image: row.imageUrl || "",
      tags: Array.isArray(row.tags)
        ? (
            row.tags as Array<{ name: string; slug?: string; color?: string }>
          ).map((t) => ({
            name: t.name,
            slug: t.slug,
            color: t.color || "#6C757D",
          }))
        : [],
      category: row.category
        ? {
            name: row.category.name,
            slug: row.category.slug,
            color: row.category.color,
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    postsFailed = true;
  }

  let categories: Awaited<
    ReturnType<typeof PostCategoryRepository.getAllWithPostCount>
  > = [];
  try {
    categories = (await PostCategoryRepository.getAllWithPostCount()).filter(
      (category) => category.postCount > 0,
    );
  } catch (error) {
    console.error("Error fetching post categories:", error);
  }

  const activeCategory = categories.find(
    (category) => category.slug === categorySlug,
  );
  const allPublishedCount = categorySlug
    ? categories.reduce((sum, category) => sum + category.postCount, 0)
    : Math.max(
        categories.reduce((sum, category) => sum + category.postCount, 0),
        posts.length,
      );

  return (
    <div className="site-shell">
      <Header />
      <main className="archive-layout">
        <aside className="archive-sidebar">
          <div className="archive-filter">
            <h2>筛选</h2>
            <Link href="/search">⌕ 按标题 / 标签</Link>
          </div>
          <div className="category-directory">
            <h2>分类</h2>
            {categories.length === 0 ? (
              <p className="index-empty">暂无分类</p>
            ) : (
              <nav aria-label="按专栏筛选文章">
                <Link
                  href="/articles"
                  className={
                    !categorySlug
                      ? "category-directory-item active"
                      : "category-directory-item"
                  }
                >
                  <span className="category-directory-dot" />
                  <span className="category-directory-name">全部文章</span>
                  <strong>{allPublishedCount}</strong>
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/articles?category=${category.slug}`}
                    className={
                      category.slug === categorySlug
                        ? "category-directory-item active"
                        : "category-directory-item"
                    }
                  >
                    <span
                      className="category-directory-dot"
                      style={{ background: category.color }}
                    />
                    <span className="category-directory-name">
                      {category.name}
                    </span>
                    <strong>{category.postCount}</strong>
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="archive-years">
            <h2>年份</h2>
            <span>
              <b>{new Date().getFullYear()}</b>
              <i>
                {activeCategory ? activeCategory.postCount : allPublishedCount}
              </i>
            </span>
          </div>
          <div className="archive-tags">
            <h2>标签</h2>
            <TagCloud />
          </div>
          <div className="index-stamp">INDEXED</div>
        </aside>

        <section className="archive-main">
          <p className="index-path">文章 /</p>
          <h1>{activeCategory?.name || "文章"}</h1>
          <p className="archive-count">
            {activeCategory ? activeCategory.postCount : allPublishedCount}{" "}
            entries · sort: date desc
          </p>
          <div className="archive-columns" aria-hidden="true">
            <span>COVER</span>
            <span>TITLE</span>
            <span>TAGS</span>
            <span>DATE</span>
            <span>MIN</span>
          </div>
          {postsFailed ? (
            <div className="index-empty">
              文章列表暂时无法加载，请稍后刷新。
            </div>
          ) : (
            <ArticlesContent
              posts={posts}
              currentPage={currentPage}
              totalPages={totalPages}
              categorySlug={categorySlug}
            />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
