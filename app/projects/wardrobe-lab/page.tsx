import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import styles from "./wardrobe-lab.module.css";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";

const SITE_NAME = "五月的火";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const PAGE_TITLE = "Wardrobe Lab · AI 形象与换装工作台 - 五月的火";
const PAGE_DESCRIPTION =
  "集自然美颜、智能换景、快速换装与实时视频换装于一体的 AI 形象工作台。";
const PAGE_IMAGE = "/projects/wardrobe-lab/live-tryon-cover.jpg";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/projects/wardrobe-lab` },
  openGraph: {
    type: "article",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/projects/wardrobe-lab`,
    siteName: SITE_NAME,
    locale: "zh_CN",
    images: [
      {
        url: PAGE_IMAGE,
        width: 1200,
        height: 630,
        alt: "Wardrobe Lab 实时视频换装展示",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [PAGE_IMAGE],
  },
};

const capabilities = [
  {
    index: "01",
    name: "自然美颜",
    english: "BEAUTY",
    description:
      "克制地统一肤色、光感与细节，保留原本的五官、表情与个人特征。",
  },
  {
    index: "02",
    name: "智能换景",
    english: "SCENE",
    description:
      "重新构建场景并匹配人物光色，让背景、接触阴影与主体自然衔接。",
  },
  {
    index: "03",
    name: "快速换装",
    english: "TRY ON",
    description:
      "人物照片与服装参考一次提交，快速得到保留身份与姿态的完整造型。",
  },
  {
    index: "04",
    name: "视频换装",
    english: "LIVE",
    description:
      "打开镜头即可预览动态穿着效果，转身、抬手时造型持续跟随画面。",
  },
] as const;

const flow = [
  ["01", "添加人物", "照片或实时镜头"],
  ["02", "选择服装", "单品、套装或文字描述"],
  ["03", "形象优化", "自然美颜与细节保护"],
  ["04", "场景协调", "背景、光色与阴影统一"],
  ["05", "完成输出", "静态成片或连续视频"],
] as const;

export default function WardrobeLabPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroTopline}>
            <div>
              <Link href="/">首页</Link>
              <i>/</i>
              <Link href="/projects">项目</Link>
              <i>/</i>
              <span>Wardrobe Lab</span>
            </div>
            <span>IMAGE &amp; MOTION · 2026</span>
          </div>

          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>AI APPEARANCE STUDIO</p>
            <h1>
              让每一次出镜，
              <br />
              <em>都像已经准备好。</em>
            </h1>
            <p className={styles.lede}>
              从一张照片到完整造型，从静态成片到镜头里的实时变化。
              Wardrobe Lab 把形象优化、场景与换装放进同一条轻量流程。
            </p>
            <ul className={styles.heroTags} aria-label="产品能力">
              <li>自然美颜</li>
              <li>智能换景</li>
              <li>快速换装</li>
              <li>视频换装</li>
            </ul>
          </div>

          <figure className={styles.heroVisual}>
            <div className={styles.heroVisualBar}>
              <span>
                <i /> LIVE PREVIEW
              </span>
              <b>WARDROBE / 01</b>
            </div>
            <div className={styles.heroMedia}>
              <Image
                src="/projects/wardrobe-lab/live-tryon.gif"
                alt="人物在实时画面中从白色上衣换成红色连衣裙"
                fill
                priority
                unoptimized
                sizes="(max-width: 760px) 100vw, 1180px"
              />
              <span className={styles.beforeLabel}>原始画面</span>
              <span className={styles.afterLabel}>视频换装</span>
            </div>
            <figcaption>
              <span>服装随人物动作连续更新</span>
              <a
                href="https://anywear.decart.ai/live-virtual-try-on"
                target="_blank"
                rel="noopener noreferrer"
              >
                官方演示素材 ↗
              </a>
            </figcaption>
          </figure>
        </section>

        <section className={styles.capabilitySection}>
          <header className={styles.sectionHeading}>
            <p>01 / WHAT IT DOES</p>
            <h2>
              不谈复杂选项，
              <br />
              只把四件事做好。
            </h2>
            <p>
              界面按任务组织能力。你只需决定想改善什么，系统会把人物保护、画面生成与最终合成接起来。
            </p>
          </header>
          <div className={styles.capabilityGrid}>
            {capabilities.map((item) => (
              <article key={item.name}>
                <div>
                  <span>{item.index}</span>
                  <i>{item.english}</i>
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.experienceSection}>
          <div className={styles.sectionHeading}>
            <p>02 / ONE WORKSPACE</p>
            <h2>
              一次输入，
              <br />
              完成整套形象。
            </h2>
            <p>
              服装适配、人物细节与场景协调在同一个工作区完成，减少来回导出和重复设置。
            </p>
          </div>

          <div className={styles.workspaceMockup}>
            <aside>
              <span>形象工作台</span>
              <nav aria-label="能力预览">
                <b>快速换装</b>
                <span>自然美颜</span>
                <span>智能换景</span>
                <span>视频换装</span>
              </nav>
              <div className={styles.uploadNote}>
                <i>+</i>
                <p>
                  <b>添加人物与服装</b>
                  <small>拖入图片即可开始</small>
                </p>
              </div>
              <button type="button" tabIndex={-1}>
                生成完整造型 <span>→</span>
              </button>
            </aside>
            <figure>
              <div className={styles.canvasHeader}>
                <span>效果预览</span>
                <i>已完成</i>
              </div>
              <div className={styles.outfitImage}>
                <Image
                  src="/projects/wardrobe-lab/outfit-change.webp"
                  alt="人物、服装与换装后效果的三栏对照"
                  fill
                  sizes="(max-width: 760px) 100vw, 820px"
                />
              </div>
              <figcaption>
                <span>人物 + 服装参考 → 完整造型</span>
                <a
                  href="https://magichour.ai/products/ai-clothes-changer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  官方演示素材 ↗
                </a>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className={styles.finishSection}>
          <figure className={styles.finishVisual}>
            <Image
              src="/projects/wardrobe-lab/scene-finish.jpg"
              alt="完成换装、美颜与场景协调的时尚成片"
              fill
              sizes="(max-width: 760px) 100vw, 52vw"
            />
            <div className={styles.finishBadge}>
              <span>BEAUTY + SCENE</span>
              <b>自然成片</b>
            </div>
          </figure>
          <div className={styles.finishCopy}>
            <p>03 / THE FINISH</p>
            <h2>不是简单贴上新衣服，而是让整张画面重新成立。</h2>
            <p>
              人物身份和五官保持稳定，服装顺着姿态自然贴合；美颜只做克制修饰，新的背景再根据人物方向匹配光线、色温与落地阴影。
            </p>
            <dl>
              <div>
                <dt>身份</dt>
                <dd>保留五官、发型与人物特征</dd>
              </div>
              <div>
                <dt>服装</dt>
                <dd>兼顾版型、褶皱与遮挡关系</dd>
              </div>
              <div>
                <dt>场景</dt>
                <dd>统一光色、透视与接触阴影</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={styles.flowSection}>
          <div className={styles.flowIntro}>
            <p>04 / FROM INPUT TO OUTPUT</p>
            <h2>一条看得懂、也能随时检查的工作流。</h2>
          </div>
          <ol>
            {flow.map(([index, title, copy]) => (
              <li key={title}>
                <span>{index}</span>
                <b>{title}</b>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.closingSection}>
          <p>WARDROBE LAB · APPEARANCE STUDIO</p>
          <h2>
            换一套衣服，换一个场景，
            <br />
            或直接在镜头里看见新的自己。
          </h2>
          <div>
            <span>自然美颜 · 智能换景 · 快速换装 · 视频换装</span>
            <b>本地原型 · 完整链路已打通</b>
          </div>
        </section>

        <div className={styles.backLink}>
          <Link href="/projects">← 返回项目归档</Link>
          <span>END OF CASE STUDY · 2026</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
