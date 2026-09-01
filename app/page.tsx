import React from "react";

import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

import AuthorBio from "../components/AuthorBio";
import BlogSection from "../components/BlogSection";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ProjectsSection from "../components/ProjectsSection";
import SearchWidget from "../components/SearchWidget";
import TagCloud from "../components/TagCloud";
import { formatDate } from "../lib/format";
import { PostRepository } from "../lib/repositories/PostRepository";
import { ProjectRepository } from "../lib/repositories/ProjectRepository";
import { SettingsRepository } from "../lib/repositories/SettingsRepository";

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

interface AuthorSettings {
  name: string;
  bio: string;
  avatar?: string;
  socialLinks: Array<{ platform: string; name: string; url: string }>;
}

const SITE_NAME = "五月的火";
const SITE_DESCRIPTION = "记录技术、设计与开发的个人博客";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: SITE_DESCRIPTION,
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "zh_CN",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og-default.png"],
  },
};

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

interface ProjectSettings {
  enabled: boolean;
  showOnHome: boolean;
  homeCount: number;
  intro: string;
  navLabel: string;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  let posts: Post[] = [];
  let currentPage = 1;
  let totalPages = 0;
  let postsFailed = false;
  let authorSettings: AuthorSettings = {
    name: SITE_NAME,
    bio: "",
    avatar: undefined,
    socialLinks: [],
  };

  try {
    const page = parseInt((await searchParams).page || "1") || 1;
    currentPage = page;
    const postsPerPage = 6;

    const result = await PostRepository.getPublicPosts({ page, limit: postsPerPage });
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
      tags: Array.isArray(row.tags) ? (row.tags as Array<{ name: string; slug?: string; color?: string }>).map((t) => ({
        name: t.name,
        slug: t.slug,
        color: t.color || '#6C757D',
      })) : [],
      category: row.category ? {
        name: row.category.name,
        slug: row.category.slug,
        color: row.category.color,
      } : undefined,
    }));

    const aboutSettings = await SettingsRepository.getAboutSettings();
    const authorAvatar = await SettingsRepository.getSettingValue('author_avatar', '');
    authorSettings = {
      name: authorName || aboutSettings.authorName,
      bio: aboutSettings.authorBioShort,
      avatar: typeof authorAvatar === 'string' && authorAvatar.trim() ? authorAvatar.trim() : undefined,
      socialLinks: aboutSettings.socialLinks.map((link) => ({
        platform: link.platform,
        name: link.name || link.platform,
        url: link.url,
      })),
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    postsFailed = true;
  }

  let featuredProjects: Awaited<ReturnType<typeof ProjectRepository.getAllProjects>> = [];
  let projectSettings: ProjectSettings = {
    enabled: true,
    showOnHome: true,
    homeCount: 3,
    intro: "我的项目与开发成果",
    navLabel: "项目",
  };

  try {
    projectSettings = await SettingsRepository.getProjectDisplaySettings();
    if (projectSettings.showOnHome) {
      const allFeatured = await ProjectRepository.getAllProjects({ featured: true, status: 'active' });
      featuredProjects = allFeatured.slice(0, projectSettings.homeCount);
      if (featuredProjects.length < projectSettings.homeCount) {
        const rest = await ProjectRepository.getAllProjects({ status: 'active' });
        const ids = new Set(featuredProjects.map((p) => p.id));
        for (const p of rest) {
          if (!ids.has(p.id) && featuredProjects.length < projectSettings.homeCount) {
            featuredProjects.push(p);
            ids.add(p.id);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  }

  return (
    <div>
      <Header projectsNavLabel={projectSettings.navLabel} projectsEnabled={projectSettings.enabled} />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            {projectSettings.showOnHome && featuredProjects.length > 0 && (
              <ProjectsSection
                projects={featuredProjects}
                title={projectSettings.navLabel}
                intro={projectSettings.intro}
              />
            )}

            {postsFailed ? (
              <div className="blog-section">
                <h1 className="section-title">最新文章</h1>
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>
                    文章列表暂时无法加载
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    数据服务可能正在维护。请稍后刷新页面重试。
                  </p>
                </div>
              </div>
            ) : (
              <BlogSection posts={posts} currentPage={currentPage} totalPages={totalPages} />
            )}
          </div>

          <div className="sidebar">
            <SearchWidget />
            <TagCloud />
            <AuthorBio
              name={authorSettings.name}
              bio={authorSettings.bio}
              avatar={authorSettings.avatar}
              socialLinks={authorSettings.socialLinks}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
