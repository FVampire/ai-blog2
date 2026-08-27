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
  tags: Array<{ name: string; color: string }>;
}

interface AuthorSettings {
  name: string;
  bio: string;
  avatar?: string;
  socialLinks: Array<{ platform: string; name: string; url: string }>;
}

export const metadata: Metadata = {
  title: "五月的火",
  description: "A blog about technology, design, and development",
  icons: { icon: "/favicon.ico" },
};

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  let posts: Post[] = [];
  let totalPosts = 0;
  let currentPage = 1;
  let totalPages = 0;
  let authorSettings: AuthorSettings = {
    name: "John Doe",
    bio: "",
    avatar: undefined,
    socialLinks: [
      { platform: "Twitter", name: "Twitter", url: "#" },
      { platform: "GitHub", name: "GitHub", url: "#" },
      { platform: "LinkedIn", name: "LinkedIn", url: "#" },
    ],
  };

  try {
    const page = parseInt((await searchParams).page || "1") || 1;
    currentPage = page;
    const postsPerPage = 6;

    const result = await PostRepository.getPublicPosts({ page, limit: postsPerPage });
    const authorName = await PostRepository.getAuthorName();

    totalPosts = result.total;
    totalPages = result.totalPages;

    posts = result.data.map((row) => ({
      id: row.id,
      title: row.title,
      date: new Date(row.publishedAt || Date.now()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      author: row.authorName || authorName,
      excerpt: row.excerpt,
      slug: row.slug,
      image: row.imageUrl || "",
      tags: Array.isArray(row.tags) ? (row.tags as Array<{ name: string; slug?: string; color?: string }>).map((t) => ({
        name: t.name,
        slug: t.slug,
        color: t.color || '#6C757D',
      })) : [],
    }));

    const aboutSettings = await SettingsRepository.getAboutSettings();
    authorSettings = {
      name: authorName || aboutSettings.authorName,
      bio: aboutSettings.authorBio,
      avatar: undefined,
      socialLinks: aboutSettings.socialLinks.map((link) => ({
        platform: link.platform,
        name: link.name || link.platform,
        url: link.url,
      })),
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
  }

  let featuredProjects: Awaited<ReturnType<typeof ProjectRepository.getAllProjects>> = [];
  let projectSettings = {
    showOnHome: true,
    homeCount: 3,
    intro: "我的项目与开发成果",
    navLabel: "Projects",
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
            <BlogSection posts={posts} currentPage={currentPage} totalPages={totalPages} />
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
