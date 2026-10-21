import Image from "next/image";
import Link from "next/link";

import styles from "./projects.module.css";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import type { ProjectCardData } from "../../components/ProjectCard";

interface Props {
  projects: ProjectCardData[];
  settings: { navLabel: string; enabled: boolean };
}

const FEATURED = [
  {
    href: "/projects/wardrobe-lab",
    path: "projects/wardrobe-lab",
    name: "Wardrobe Studio",
    kind: "appearance",
    year: "2026",
    description: "从照片到视频的 AI 换装：七种造型、五段动态换装，始终是同一个你。",
    image: "/projects/wardrobe-lab/cover.webp",
    tags: ["身份一致", "视频换装", "画质修复"],
  },
  {
    href: "/projects/ai-garment-pattern-agent",
    path: "projects/ai-garment-pattern-agent",
    name: "AI 服装打版 Agent",
    kind: "agent/cad",
    year: "2026",
    description: "从复杂款式理解到组合制版、几何校验与样衣交付的 AI 工程系统。",
    image:
      "/projects/ai-garment-pattern-agent/cover.webp",
    tags: ["对话改版", "2D / 3D", "Tech Pack"],
  },
  {
    href: "/projects/moling",
    path: "projects/moling",
    name: "墨韵 Moyun",
    kind: "workbench",
    year: "2026",
    description: "全书级上下文、多模型竞选与故事记忆，让一部长篇始终记得自己。",
    image: "/projects/moling/cover.webp",
    tags: ["多模型竞选", "故事记忆", "51 万字"],
  },
  {
    href: "/projects/forgetting-tide",
    path: "projects/forgetting-tide",
    name: "遗忘潮汐",
    kind: "godot",
    year: "2026",
    description: "叙事构筑与记忆潮汐。",
    image: "/projects/forgetting-tide/hero.png",
    tags: ["REV 0.3", "Godot 4", "deckbuilding"],
  },
  {
    href: "/projects/ai-interior-design",
    path: "projects/ai-interior-design",
    name: "栖居 · AI 装修设计",
    kind: "ai/space",
    year: "2026",
    description: "从户型识别、需求简报到方案生成，最终交付一个可以亲手探索的 3D 方案。",
    image: "/projects/ai-interior-design/cover.webp",
    tags: ["三种风格", "生成过程", "3D 交付"],
  },
] as const;

export default function ProjectsArchive({ projects, settings }: Props) {
  return (
    <div className="site-shell">
      <Header
        projectsNavLabel={settings.navLabel}
        projectsEnabled={settings.enabled}
      />
      <main className={styles.archiveLayout}>
        <aside className={styles.index}>
          <p>INDEX</p>
          <nav>
            <span className={styles.active}>
              <b>全部</b>
              <i>{FEATURED.length + projects.length}</i>
            </span>
            <span>
              <b>产品与 AI</b>
              <i>{3 + projects.length}</i>
            </span>
            <span>
              <b>游戏与交互</b>
              <i>1</i>
            </span>
            <span>
              <b>空间设计</b>
              <i>1</i>
            </span>
          </nav>
          <div className={styles.stamp}>INDEXED</div>
        </aside>
        <section className={styles.archiveMain}>
          <p className={styles.path}>项目 /</p>
          <h1>{settings.navLabel || "项目"}</h1>
          <p className={styles.count}>
            {FEATURED.length + projects.length} cases · sort: year desc
          </p>
          <div className={styles.docbar}>
            <span>DOC MF-PRJ</span>
            <span>
              | REV 0.8 | DATE {new Date().toISOString().slice(0, 10)}
            </span>
          </div>
          <div className={styles.records}>
            {FEATURED.map((project) => (
              <Link
                href={project.href}
                className={styles.record}
                key={project.href}
              >
                <figure>
                  <div>
                    <Image
                      src={project.image}
                      unoptimized={project.image.startsWith("https://") || project.image.startsWith("/uploads/")}
                      alt=""
                      fill
                      sizes="420px"
                    />
                  </div>
                </figure>
                <div className={styles.recordCopy}>
                  <p>
                    <em>{project.path}</em> · {project.kind} · {project.year}
                  </p>
                  <h2>{project.name}</h2>
                  <div>{project.description}</div>
                  <ul>
                    {project.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <strong>打开案例 →</strong>
                </div>
              </Link>
            ))}
            {projects.map((project) => (
              <Link
                href={`/projects/${project.slug}`}
                className={styles.record}
                key={project.id}
              >
                <figure>
                  <div>
                    {project.imageUrl ? (
                      <Image
                        src={project.imageUrl}
                        alt=""
                        fill
                        sizes="420px"
                        unoptimized
                      />
                    ) : (
                      <b>{project.name.slice(0, 1)}</b>
                    )}
                  </div>
                </figure>
                <div className={styles.recordCopy}>
                  <p>
                    <em>projects/{project.slug}</em> · archive
                  </p>
                  <h2>{project.name}</h2>
                  <div>{project.description}</div>
                  <ul>
                    {project.techStack.slice(0, 3).map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <strong>打开案例 →</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
