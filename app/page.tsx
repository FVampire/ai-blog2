import React from "react";

import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

import AuthorBio from "../components/AuthorBio";
import BlogSection from "../components/BlogSection";
import Footer from "../components/Footer";
import Header from "../components/Header";
import SearchWidget from "../components/SearchWidget";
import TagCloud from "../components/TagCloud";
import { PostRepository } from "../lib/repositories/PostRepository";
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

    totalPosts = result.total;
    totalPages = result.totalPages;

    posts = result.data.map((row) => ({
      id: row.id,
      title: row.title,
      date: new Date(row.publishedAt as any).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      author: row.authorName || "",
      excerpt: row.excerpt,
      slug: row.slug,
      image: row.imageUrl || "",
      tags: Array.isArray(row.tags) ? row.tags.map((t: any) =>
        typeof t === 'string' ? { name: t, color: '#6C757D' } : { name: t.name, color: t.color || '#6C757D' }
      ) : [],
    }));

    const aboutSettings = await SettingsRepository.getAboutSettings();
    authorSettings = {
      name: aboutSettings.authorName,
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

  return (
    <div>
      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
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
