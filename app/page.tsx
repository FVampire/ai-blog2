import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import Footer from "../components/Footer";
import Header from "../components/Header";
import SafeImage from "../components/SafeImage";
import { formatDate } from "../lib/format";
import { PostCategoryRepository } from "../lib/repositories/PostCategoryRepository";
import { PostRepository } from "../lib/repositories/PostRepository";
import { ProjectRepository } from "../lib/repositories/ProjectRepository";
import { SettingsRepository } from "../lib/repositories/SettingsRepository";
import { getAvailableTools } from "../lib/tools/registry";

export const dynamic = "force-dynamic";

const SITE_NAME = "五月的火";
const SITE_DESCRIPTION = "记录技术、设计与开发的个人博客";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
};

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

const STATIC_PROJECTS = [
  {
    slug: "wardrobe-lab",
    href: "/projects/wardrobe-lab",
    name: "Wardrobe Studio",
    meta: "appearance · 2026",
    image: "/projects/wardrobe-lab/cover.webp",
  },
  {
    slug: "ai-garment-pattern-agent",
    href: "/projects/ai-garment-pattern-agent",
    name: "AI 服装打版 Agent",
    meta: "agent/cad · 2026",
    image:
      "/projects/ai-garment-pattern-agent/cover.webp",
  },
  {
    slug: "moling",
    href: "/projects/moling",
    name: "墨韵 Moyun",
    meta: "workbench · 2026",
    image: "/projects/moling/cover.webp",
  },
  {
    slug: "forgetting-tide",
    href: "/projects/forgetting-tide",
    name: "遗忘潮汐",
    meta: "godot · 2026",
    image: "/projects/forgetting-tide/hero.png",
  },
] as const;

function readMinutes(text: string) {
  return Math.max(1, Math.ceil(text.replace(/\s/g, "").length / 300));
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await searchParams;
  let result: Awaited<ReturnType<typeof PostRepository.getPublicPosts>> = {
    data: [],
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 0,
  };
  let categories: Awaited<
    ReturnType<typeof PostCategoryRepository.getAllWithPostCount>
  > = [];
  let projects: Awaited<ReturnType<typeof ProjectRepository.getAllProjects>> =
    [];
  let projectSettings = { enabled: true, navLabel: "项目" };

  try {
    [result, categories, projects, projectSettings] = await Promise.all([
      PostRepository.getPublicPosts({ page: 1, limit: 8 }),
      PostCategoryRepository.getAllWithPostCount(),
      ProjectRepository.getAllProjects({ status: "active" }),
      SettingsRepository.getProjectDisplaySettings(),
    ]);
  } catch (error) {
    console.error("Error loading home index:", error);
  }

  const posts = result.data;
  const lead = posts[0];
  const tools = getAvailableTools();
  const latestUpdate = lead?.publishedAt ? formatDate(lead.publishedAt) : "—";
  const staticSlugs = new Set<string>(
    STATIC_PROJECTS.map((project) => project.slug),
  );
  const totalProjects =
    STATIC_PROJECTS.length +
    projects.filter((project) => !staticSlugs.has(project.slug)).length;

  return (
    <div className="site-shell">
      <Header
        projectsNavLabel={projectSettings.navLabel}
        projectsEnabled={projectSettings.enabled}
      />
      <main className="home-index">
        <aside className="home-index-sidebar" aria-label="站点索引">
          <p className="index-label">INDEX</p>
          <nav>
            <Link href="/articles">
              <span>文章</span>
              <b>{result.total}</b>
            </Link>
            <Link href="/projects">
              <span>项目</span>
              <b>{totalProjects}</b>
            </Link>
            <Link href="/tools">
              <span>工具</span>
              <b>{tools.length}</b>
            </Link>
          </nav>
          <div className="index-rule" />
          <h2>分类</h2>
          <nav>
            {categories
              .filter((item) => item.postCount > 0)
              .slice(0, 6)
              .map((category) => (
                <Link
                  key={category.id}
                  href={`/articles?category=${category.slug}`}
                >
                  <span>{category.name}</span>
                  <b>{category.postCount}</b>
                </Link>
              ))}
          </nav>
          <div className="index-stamp">INDEXED</div>
        </aside>

        <section className="home-index-main">
          <p className="index-path">/</p>
          <h1>{SITE_NAME}</h1>
          <p className="home-index-stats">
            {result.total} posts · {totalProjects} projects · {tools.length}{" "}
            tools · updated {latestUpdate}
          </p>

          {lead ? (
            <article className="home-feature">
              {lead.imageUrl ? (
                <Link
                  href={`/posts/${lead.slug}`}
                  className="home-feature-image"
                >
                  <SafeImage
                    src={lead.imageUrl}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 900px) 100vw, 320px"
                  />
                </Link>
              ) : (
                <div className="home-feature-image home-feature-placeholder">
                  FIG. 01
                </div>
              )}
              <div className="home-feature-copy">
                <p className="record-path">
                  posts/{lead.category?.slug || "notes"}
                </p>
                <h2>
                  <Link href={`/posts/${lead.slug}`}>{lead.title}</Link>
                </h2>
                <p>{lead.excerpt}</p>
                <div className="record-meta">
                  {formatDate(lead.publishedAt)} ·{" "}
                  {readMinutes(`${lead.title}${lead.excerpt}`)} min
                </div>
                <div className="record-tags">
                  {lead.tags.slice(0, 3).map((tag) => (
                    <Link href={`/tags/${tag.slug}`} key={tag.id}>
                      {tag.name}
                    </Link>
                  ))}
                </div>
                <Link className="record-action" href={`/posts/${lead.slug}`}>
                  阅读全文 <span>→</span>
                </Link>
              </div>
            </article>
          ) : (
            <div className="index-empty">文章索引暂时不可用。</div>
          )}

          <div className="home-recent-heading">
            <h2>最近条目</h2>
            <Link href="/articles">全部文章 →</Link>
          </div>
          <div className="home-record-table">
            <div className="home-record-head">
              <span>DATE</span>
              <span>TITLE</span>
              <span>TAGS</span>
              <span>MIN</span>
            </div>
            {posts.slice(0, 6).map((post) => (
              <Link
                href={`/posts/${post.slug}`}
                className="home-record-row"
                key={post.id}
              >
                <time>{formatDate(post.publishedAt)}</time>
                <strong>{post.title}</strong>
                <span>
                  {post.tags[0]?.name || post.category?.name || "笔记"}
                </span>
                <i>{readMinutes(`${post.title}${post.excerpt}`)}m</i>
              </Link>
            ))}
          </div>
        </section>

        <aside className="home-index-rail">
          <div className="rail-heading">
            <h2>项目</h2>
            <Link href="/projects">全部 →</Link>
          </div>
          <div className="rail-projects">
            {STATIC_PROJECTS.map((project) => (
              <Link href={project.href} key={project.href}>
                <span className="rail-project-image">
                  <Image
                    src={project.image}
                    unoptimized={project.image.startsWith("https://")}
                    alt=""
                    fill
                    sizes="150px"
                  />
                </span>
                <span>
                  <strong>{project.name}</strong>
                  <small>{project.meta}</small>
                </span>
              </Link>
            ))}
          </div>
          <div className="rail-heading rail-tools-title">
            <h2>工具</h2>
          </div>
          <nav className="rail-tools">
            {tools.slice(0, 6).map((tool) => (
              <Link href={`/tools/${tool.slug}`} key={tool.slug}>
                <span>{tool.slug}</span>
                <b>↵</b>
              </Link>
            ))}
          </nav>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
