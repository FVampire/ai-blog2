import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import ProductWorkbench from "./ProductWorkbench";
import styles from "./showcase.module.css";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";

const BASE = "/projects/ai-garment-pattern-agent";
const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const description =
  "SEAM AI 服装打版工作台：把参考图与设计语言连接到款式结构、2D 纸样、3D 预览和样衣技术包，让每一次改版都有迹可循。";
export const metadata: Metadata = {
  title: { absolute: "SEAM · 从灵感到纸样 - 五月的火" },
  description,
  alternates: { canonical: `${SITE}${BASE}` },
  openGraph: {
    title: "SEAM · 从灵感到纸样",
    description,
    type: "article",
    url: `${SITE}${BASE}`,
    images: [
      {
        url: "https://blog-1304232496.cos.ap-shanghai.myqcloud.com/uploads/1788592690503-637778501.webp",
        alt: "SEAM 产品效果演示",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEAM · 从灵感到纸样",
    description,
    images: [
      "https://blog-1304232496.cos.ap-shanghai.myqcloud.com/uploads/1788592690503-637778501.webp",
    ],
  },
};
const steps = [
  [
    "01",
    "描述你的设计",
    "一张参考图，一段款式描述。把廓形、领型、袖型和面料意图带进同一个项目。",
    "参考图 / 自然语言",
  ],
  [
    "02",
    "让想法成为结构",
    "选择基础尺码，调整松量和关键尺寸。将设计细节组织成可以继续编辑的服装规格。",
    "款式结构 / 尺寸参数",
  ],
  [
    "03",
    "边看，边改版",
    "在概念、3D 结构与 2D 纸样之间切换，用自然语言调整版型，查看尺寸变化。",
    "对话改版 / 几何校验",
  ],
  [
    "04",
    "把设计交给样衣室",
    "纸样、工艺卡、物料清单与尺寸表随项目汇集，连接原尺寸打印和样衣复核。",
    "纸样文件 / 技术包",
  ],
];
export default function GarmentPatternAgentPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.page}>
        <div className={styles.topline}>
          <Link href="/projects">← 项目归档</Link>
          <span>PRODUCT DESIGN & ENGINEERING / 2026</span>
        </div>
        <section className={styles.hero}>
          <div className={styles.heroBrand}>
            <span className={styles.wordmark}>
              SEAM<span>✳</span>
            </span>
            <span>
              AI GARMENT
              <br />
              PATTERN STUDIO
            </span>
          </div>
          <div className={styles.heroCopy}>
            <div>
              <p className={styles.eyebrow}>让创意，沿着每一道缝线落地。</p>
              <h1>
                从灵感到纸样。
                <br />
                <span>和 AI 一起，把衣服做出来。</span>
              </h1>
            </div>
            <div className={styles.intro}>
              <p>
                把参考图、设计对话与精确制版放进同一个工作台。从一件衣服的轮廓，到每一片纸样的细节，让设计与制作保持连接。
              </p>
              <a className={styles.primary} href="#workbench">
                探索工作台 <span>↗</span>
              </a>
              <a className={styles.textLink} href="#delivery">
                查看交付体验 ↓
              </a>
            </div>
          </div>
          <figure className={styles.heroVisual}>
            <Image
              src={
                "https://blog-1304232496.cos.ap-shanghai.myqcloud.com/uploads/1788592690503-637778501.webp"
              }
              alt="SEAM 产品效果演示：设计对话、白色衬衫三维视图与二维纸样并列的工作台"
              unoptimized
              width={1568}
              height={1003}
              priority
              sizes="(max-width: 760px) 100vw, 1280px"
            />
            <figcaption>
              <span>01 / THE CONNECTED WORKSPACE</span>
              <span>产品效果演示 · AI 生成视觉</span>
            </figcaption>
          </figure>
          <div className={styles.featureStrip}>
            <span>多模态设计输入</span>
            <i>+</i>
            <span>对话式参数改版</span>
            <i>+</i>
            <span>2D / 3D 联合查看</span>
            <i>+</i>
            <span>样衣技术包</span>
          </div>
        </section>
        <section className={styles.section} id="workflow">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>01 / FROM IDEA TO SAMPLE</p>
            <h2>一件衣服，一条连续的工作流。</h2>
            <p>
              不用在聊天记录、纸样文件和工艺表之间重新解释设计。每一步，都接着上一步继续。
            </p>
          </div>
          <div className={styles.steps}>
            {steps.map(([n, title, copy, tag]) => (
              <article key={n}>
                <span className={styles.stepNumber}>{n}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <small>{tag}</small>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.section} id="workbench">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>
              02 / ONE DESIGN, THREE PERSPECTIVES
            </p>
            <h2>看见衣服，也看清它的构成。</h2>
            <p>以一件日常衬衫为线索，探索设计、纸样与交付之间的关系。</p>
          </div>
          <ProductWorkbench />
        </section>
        <section className={styles.dialogueSection} id="iteration">
          <div>
            <p className={styles.eyebrow}>03 / DESIGN THROUGH DIALOGUE</p>
            <h2>
              “袖子再长 3cm。”
              <br />
              <span>让改版像沟通一样自然。</span>
            </h2>
            <p>
              说出想调整的部位和尺寸，Agent
              将它转换为明确的参数变化，再由制版内核重新计算纸样。你关注穿着效果，系统整理结构和尺寸之间的关系。
            </p>
            <div className={styles.miniFacts}>
              <span>自然语言调整</span>
              <span>尺寸差异对照</span>
              <span>项目版本记录</span>
            </div>
          </div>
          <div
            className={styles.conversation}
            aria-label="自然语言改版交互示例"
          >
            <header>
              <span className={styles.dot} />
              EVERYDAY SHIRT <span>改版示例 / V02</span>
            </header>
            <div className={styles.userMessage}>
              保持落肩廓形，袖子加长 3cm。
            </div>
            <div className={styles.agentMessage}>
              <b>SEAM</b>
              <p>
                本次调整袖长，保留领型、门襟和衣身松量。下面是改版前后的尺寸对照。
              </p>
            </div>
            <div className={styles.delta}>
              <span>袖长</span>
              <span>
                52 cm <i>→</i> <b>55 cm</b>
              </span>
              <em>+3 cm</em>
            </div>
            <div className={styles.delta}>
              <span>衣长</span>
              <span>
                68 cm <i>→</i> <b>68 cm</b>
              </span>
              <small>保持</small>
            </div>
            <footer>参数变化 → 纸样重算 → 几何检查 → 版本留存</footer>
          </div>
        </section>
        <section className={styles.section} id="delivery">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>04 / MADE FOR THE NEXT HANDOFF</p>
            <h2>交出去的，是一份完整的设计语言。</h2>
            <p>
              从屏幕上的衣服，到样衣室里的第一针。把制作需要的信息放在一起。
            </p>
          </div>
          <div className={styles.deliveryGrid}>
            <article className={styles.package}>
              <div className={styles.packageTop}>
                <span>SEAM / PROJECT PACKAGE</span>
                <span>↗</span>
              </div>
              <h3>Everyday Shirt</h3>
              <p>日常衬衫 · 样衣技术包</p>
              {[
                ["01", "纸样与裁片", "SVG / PDF / DXF"],
                ["02", "工艺操作卡", "制作顺序 · 工艺要求"],
                ["03", "面辅料清单", "BOM · 参考用量"],
                ["04", "成衣尺寸表", "测量部位 · 目标值 · 公差"],
              ].map(([n, title, format]) => (
                <div className={styles.fileRow} key={n}>
                  <span>{n}</span>
                  <b>{title}</b>
                  <small>{format}</small>
                </div>
              ))}
              <footer>DESIGN → PATTERN → TECH PACK</footer>
            </article>
            <div className={styles.deliveryDetails}>
              <article>
                <span>01 / PRINT</span>
                <h3>在纸上，还原每一毫米。</h3>
                <p>
                  A4、A3
                  拼接与绘图仪原尺寸输出，配合校准框和对位标记，把纸样从画布带到裁剪台。
                </p>
              </article>
              <article>
                <span>02 / HANDOFF</span>
                <h3>让设计师和版师说同一种语言。</h3>
                <p>
                  片名、缝份、纱向与工艺信息跟随纸样，SVG、PDF 与 DXF
                  服务于查看、打印和 CAD 交接。
                </p>
              </article>
              <article>
                <span>03 / REFINE</span>
                <h3>把样衣反馈，留在项目里。</h3>
                <p>
                  记录实测尺寸与公差，保存每一次样衣复核和版本变化，让下一轮调整有据可依。
                </p>
              </article>
            </div>
          </div>
        </section>
        <section className={styles.engine}>
          <p className={styles.eyebrow}>THE ENGINE UNDER THE FABRIC</p>
          <h2>
            理解交给 AI。
            <br />
            精度交给几何。
          </h2>
          <p>
            模型理解款式和调整意图，确定性 CAD
            内核计算曲线、裁片和缝长。结构化的设计数据贯穿整个项目，让灵活的表达与严谨的制版各司其职。
          </p>
          <div>
            <span>
              StyleGraph<small>款式语义</small>
            </span>
            <i>→</i>
            <span>
              Pattern Planner<small>制版规划</small>
            </span>
            <i>→</i>
            <span>
              CAD Kernel<small>几何与校验</small>
            </span>
            <i>→</i>
            <span>
              Tech Pack<small>样衣交付</small>
            </span>
          </div>
        </section>
        <section className={styles.closing}>
          <p className={styles.eyebrow}>SEAM / AI GARMENT PATTERN AGENT</p>
          <h2>
            让好设计，
            <br />
            更接近一件真正的衣服。
          </h2>
          <Link className={styles.primary} href="/projects">
            探索更多项目 <span>↗</span>
          </Link>
          <a className={styles.textLink} href="#workbench">
            再看一眼工作台 ↑
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
