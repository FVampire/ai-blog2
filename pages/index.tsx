import React from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TagCloud from "../components/TagCloud";
import AuthorBio from "../components/AuthorBio";
import SearchWidget from "../components/SearchWidget";
import BlogSection from "../components/BlogSection";
import { SettingsRepository } from "../lib/repositories/SettingsRepository";
import { query } from "../lib/db";

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

interface HomePageProps {
  posts: Post[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
  authorSettings: AuthorSettings;
}

const HomePage: React.FC<HomePageProps> = ({ posts, currentPage, totalPages, authorSettings }) => {
  return (
    <div>
      <Head>
        <title>五月的火</title>
        <meta name="description" content="A blog about technology, design, and development" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

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
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    console.log("🔵 [HomePage] Starting database query...");
    const page = parseInt(context.query.page as string) || 1;
    const postsPerPage = 4;
    const offset = (page - 1) * postsPerPage;

    console.log(`📄 [HomePage] Fetching page ${page}, offset ${offset}`);

    // 查询已发布的文章
    const result = await query(
      `
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.image_url,
        p.views, p.published_at,
        u.username as author_name,
        COALESCE(
          json_agg(
            json_build_object('name', t.name, 'color', t.color)
          ) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = 'published'
      GROUP BY p.id, u.username
      ORDER BY p.published_at DESC
      LIMIT $1 OFFSET $2
      `,
      [postsPerPage, offset],
    );

    // 获取总数
    const countResult = await query("SELECT COUNT(*) FROM posts WHERE status = $1", ["published"]);

    const totalPosts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    // 格式化数据
    const posts: Post[] = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      date: new Date(row.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      author: row.author_name,
      excerpt: row.excerpt,
      slug: row.slug,
      image: row.image_url || "",
      tags: row.tags,
    }));

    // 获取作者设置
    const aboutSettings = await SettingsRepository.getAboutSettings();
    const authorSettings = {
      name: aboutSettings.authorName,
      bio: aboutSettings.authorBio,
      avatar: null,
      socialLinks: aboutSettings.socialLinks.map(link => ({
        platform: link.platform,
        name: link.name || link.platform,
        url: link.url,
      })),
    };

    return {
      props: {
        posts,
        totalPosts,
        currentPage: page,
        totalPages,
        authorSettings,
      },
    };
  } catch (error) {
    console.error("Error fetching posts:", error);

    // 返回空数据以防止错误
    return {
      props: {
        posts: [],
        totalPosts: 0,
        currentPage: 1,
        totalPages: 0,
        authorSettings: {
          name: "John Doe",
          bio: "",
          avatar: undefined,
          socialLinks: [
            { platform: "Twitter", name: "Twitter", url: "#" },
            { platform: "GitHub", name: "GitHub", url: "#" },
            { platform: "LinkedIn", name: "LinkedIn", url: "#" },
          ],
        },
      },
    };
  }
};

export default HomePage;
