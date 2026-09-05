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
    name: "Wardrobe Lab",
    kind: "appearance",
    year: "2026",
    description: "从自然美颜与智能换景，到静态和实时视频换装。",
    image: "/projects/wardrobe-lab/tryon-workspace.webp",
    tags: ["REV 0.1", "美颜换景", "视频换装"],
    caption: "FIG. 2-1  wardrobe.jpg",
  },
  {
    href: "/projects/ai-garment-pattern-agent",
    path: "projects/ai-garment-pattern-agent",
    name: "AI 服装打版 Agent",
    kind: "agent/cad",
    year: "2026",
    description: "从设计对话到纸样与样衣技术包的 AI 制版工作台。",
    image:
      "https://blog-1304232496.cos.ap-shanghai.myqcloud.com/uploads/1788592690503-637778501.webp",
    tags: ["对话改版", "2D / 3D", "Tech Pack"],
    caption: "FIG. 2-2  seam.png",
  },
  {
    href: "/projects/moling",
    path: "projects/moling",
    name: "墨灵 Moling",
    kind: "workbench",
    year: "2026",
    description: "从大纲到可交付章节的写作工作台。",
    image: "/projects/moling/moling-project-overview-full-v5.png",
    tags: ["REV 0.5", "27 steps", "0 fail"],
    caption: "FIG. 2-3  moling.png",
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
    caption: "FIG. 2-4  tide.png",
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
                  <span>{project.caption}</span>
                  <div>
                    <Image
                      src={project.image}
                      unoptimized={project.image.startsWith("https://")}
                      alt=""
                      fill
                      sizes="420px"
                    />
                  </div>
                  <figcaption>
                    图 {project.caption.slice(5)} <i>8%</i>
                  </figcaption>
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
                  <span>FIG. DB-{project.id}</span>
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
                  <figcaption>
                    图 project-{project.id} <i>8%</i>
                  </figcaption>
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
