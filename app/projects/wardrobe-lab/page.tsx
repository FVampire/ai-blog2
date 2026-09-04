import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import LucyTryOnDemo from "./LucyTryOnDemo";
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
  "一套可在本地运行的 AI 形象工作台：人物解析、自然美颜、智能换景、快速换装与实时视频换装。";
const PAGE_IMAGE = "/projects/wardrobe-lab/tryon-workspace.webp";

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
        width: 1586,
        height: 992,
        alt: "Wardrobe Lab 快速换装工作界面",
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

const pipelineStages = [
  {
    index: "01",
    title: "输入标准化",
    english: "INGEST",
    description:
      "人物照与服装商品图先按原方向和像素尺寸转换为高质量 WebP。每次生成取得独立任务编号，输入、参数和过程状态写入本地任务目录。",
    input: "人物图 / 服装图",
    output: "input_person.webp / input_garment.webp",
    runner: "LOCAL",
  },
  {
    index: "02",
    title: "整人抠图",
    english: "CUTOUT",
    description:
      "本地人像分割提取完整人物和透明边缘。原图不会因为这一阶段离开本机，发丝、鞋底与身体外轮廓会继续参与后续合成。",
    input: "标准化人物图",
    output: "01_person_cutout.png",
    runner: "LOCAL · ONNX",
  },
  {
    index: "03",
    title: "人体解析",
    english: "PARSING",
    description:
      "将头发、脸部、上装、下装、手臂与腿部分区。抠图和人体解析由两个常驻进程并行执行，模型会话复用，避免每次任务重新冷启动。",
    input: "原始人物图",
    output: "02_human_parsing.png / labels.png",
    runner: "LOCAL · ONNX",
  },
  {
    index: "04",
    title: "自然美颜",
    english: "BEAUTY",
    description:
      "只在透明人物上使用连续软遮罩调整裸露皮肤与整体光色。五官几何、表情、发型、头部位置和原始裁切状态保持不变。",
    input: "人物抠图 + 人体分区",
    output: "03_beautified_source.png",
    runner: "LOCAL",
  },
  {
    index: "05",
    title: "服装生成",
    english: "TRY ON",
    description:
      "后端适配层把统一输入转成供应商所需协议。界面只呈现“快速换装”，不会让使用者面对模型名称；供应商原图与透明人物结果分开保留，便于排查。",
    input: "美颜人物 + 服装参考",
    output: "04_dressed_raw.png / 04_dressed_cutout.png",
    runner: "CLOUD + LOCAL",
  },
  {
    index: "06",
    title: "换景与合成",
    english: "COMPOSITE",
    description:
      "换景开启时，背景服务只接收无人空白画布和场景描述，并与换装并行生成。最后在本地统一比例、环境光、色温与接触阴影，只合成人物一次。",
    input: "透明造型 + 无人背景",
    output: "05_background.png / 06_final.png",
    runner: "PARALLEL · LOCAL FINAL",
  },
] as const;

const deliveryNotes = [
  {
    title: "本地运行",
    value: "Vite + Node + Python",
    description:
      "前端构建后由本地 Node 服务统一提供；Python sidecar 负责分割、人体解析与最终图像处理，不依赖数据库或边缘运行时。",
  },
  {
    title: "任务可恢复",
    value: "job.json + stepKey",
    description:
      "每个阶段都记录输入、参数和上游签名。失败或服务重启后，只复用文件仍存在且算法版本匹配的连续阶段。",
  },
  {
    title: "服务端安全",
    value: "Key never reaches browser",
    description:
      "长期密钥、图片数据和供应商临时地址只在服务端使用；结构化日志会移除 Token、Authorization 与图片 Base64。",
  },
  {
    title: "交付方式",
    value: "Windows / Ubuntu CPU & GPU",
    description:
      "除本地开发模式外，项目还准备了 Ubuntu x86_64 自解压包，并区分 CPU 与 CUDA 运行环境，方便在本地或独立服务器验收。",
  },
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

          <dl className={styles.heroMeta}>
            <div>
              <dt>SCOPE</dt>
              <dd>本地人物形象工作台</dd>
            </div>
            <div>
              <dt>CORE</dt>
              <dd>本地视觉 + 云端生成</dd>
            </div>
            <div>
              <dt>OUTPUT</dt>
              <dd>PNG / MP4 / 任务日志</dd>
            </div>
            <div>
              <dt>STATUS</dt>
              <dd>v0.1.5 · Local Prototype</dd>
            </div>
          </dl>

          <LucyTryOnDemo />
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

        <section className={styles.projectSection}>
          <header className={styles.sectionHeading}>
            <p>02 / THE REAL PROJECT</p>
            <h2>
              不是一张效果图，
              <br />
              而是一条可检查的生成链路。
            </h2>
            <p>
              原项目是运行在本机的完整 Demo。它把本地视觉处理、云端换装与背景生成、任务恢复和日志排查放进同一套服务，而前台只保留用户真正关心的功能。
            </p>
          </header>

          <div className={styles.projectBrief}>
            <article>
              <span>WHY</span>
              <h3>让非技术使用者完成一次可控的形象制作。</h3>
              <p>
                单次模型调用很容易得到一张“看起来不错”的图，但真实使用还要解决人物身份漂移、旧衣残留、背景重复人物、任务中断和临时结果丢失。这个项目的工作重点，是把这些问题变成可以逐阶段检查的工程流程。
              </p>
            </article>
            <dl>
              <div>
                <dt>图像路径</dt>
                <dd>6 个可见阶段</dd>
              </div>
              <div>
                <dt>视频路径</dt>
                <dd>上传视频 / 浏览器摄像头</dd>
              </div>
              <div>
                <dt>任务状态</dt>
                <dd>逐阶段持久化，可续跑</dd>
              </div>
              <div>
                <dt>数据位置</dt>
                <dd>本机任务目录</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={styles.pipelineSection}>
          <header className={styles.pipelineHeading}>
            <p>03 / IMAGE PIPELINE</p>
            <h2>六个阶段，每一步都留下输入、产出与运行记录。</h2>
          </header>
          <ol className={styles.pipelineList}>
            {pipelineStages.map((stage) => (
              <li key={stage.index}>
                <header>
                  <span>
                    {stage.index} / {stage.english}
                  </span>
                  <i>{stage.runner}</i>
                </header>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
                <dl>
                  <div>
                    <dt>输入</dt>
                    <dd>{stage.input}</dd>
                  </div>
                  <div>
                    <dt>产出</dt>
                    <dd>{stage.output}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.experienceSection}>
          <div className={styles.sectionHeading}>
            <p>04 / PRODUCT EXPERIENCE</p>
            <h2>
              每一种能力，
              <br />
              都有清楚的结果预览。
            </h2>
            <p>
              不出现模型、版本或技术参数。界面只保留任务入口、直观对照和完成按钮，让人一眼知道能做什么。
            </p>
          </div>

          <div className={styles.interfaceGallery}>
            <figure className={styles.interfaceFeature}>
              <div className={styles.interfaceImage}>
                <Image
                  src="/projects/wardrobe-lab/beauty-workspace.webp"
                  alt="Wardrobe Lab 自然美颜界面，左右对比原图与克制修饰后的效果"
                  fill
                  priority
                  sizes="(max-width: 760px) 100vw, 1180px"
                />
              </div>
              <figcaption>
                <span>
                  <i>01</i>
                  <b>自然美颜</b>
                </span>
                <p>同一张脸，只改善肤色、光感与细节。</p>
              </figcaption>
            </figure>

            <figure>
              <div className={styles.interfaceImage}>
                <Image
                  src="/projects/wardrobe-lab/background-workspace.webp"
                  alt="Wardrobe Lab 智能换景界面，人物保持不变并替换为暖色室内背景"
                  fill
                  sizes="(max-width: 760px) 100vw, 590px"
                />
              </div>
              <figcaption>
                <span>
                  <i>02</i>
                  <b>智能换景</b>
                </span>
                <p>人物不动，只替换背景并协调环境光。</p>
              </figcaption>
            </figure>

            <figure>
              <div className={styles.interfaceImage}>
                <Image
                  src="/projects/wardrobe-lab/tryon-workspace.webp"
                  alt="Wardrobe Lab 快速换装界面，人物和服装参考生成完整穿搭"
                  fill
                  sizes="(max-width: 760px) 100vw, 590px"
                />
              </div>
              <figcaption>
                <span>
                  <i>03</i>
                  <b>快速换装</b>
                </span>
                <p>
                  人物与服装参考进入同一画布，直接看到完整造型。
                  <a
                    href="https://fashn.ai/blog/introducing-v1-6"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    效果参考 ↗
                  </a>
                </p>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className={styles.deliverySection}>
          <header className={styles.pipelineHeading}>
            <p>05 / ENGINEERING DELIVERY</p>
            <h2>能运行、能恢复、也知道哪里可能出错。</h2>
          </header>
          <div className={styles.deliveryGrid}>
            {deliveryNotes.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <b>{item.value}</b>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
          <aside className={styles.limitNote}>
            <span>KNOWN LIMITS</span>
            <p>
              复杂遮挡、透明服装和极端姿势仍可能造成解析误差；生成式换装也不能保证纹理逐像素不变。当前交付定位是本地原型与成片辅助工具，商业输出仍需要人工验收。
            </p>
          </aside>
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
            <b>本地原型 · 六阶段链路 · 可恢复任务</b>
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
