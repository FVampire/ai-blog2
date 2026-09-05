import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import { CaseBreakdown, CapabilityGrid, DesignRange } from "./CapabilityStory";
import FourViewStory from "./FourViewStory";
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
  "SEAM 服装制版 AI 工程系统：多模态款式理解、组合式制版、确定性 CAD、几何与缝长校验，连接复杂设计、整套纸样和样衣技术包。";
export const metadata: Metadata = {
  title: { absolute: "SEAM · 服装制版的 AI 工程系统 - 五月的火" },
  description,
  alternates: { canonical: `${SITE}${BASE}` },
  openGraph: {
    title: "SEAM · 服装制版的 AI 工程系统",
    description,
    type: "article",
    url: `${SITE}${BASE}`,
    images: [
      {
        url: "https://blog-1304232496.cos.ap-shanghai.myqcloud.com/uploads/1788615421150-775873709.webp",
        alt: "SEAM 产品效果演示",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEAM · 服装制版的 AI 工程系统",
    description,
    images: [
      "https://blog-1304232496.cos.ap-shanghai.myqcloud.com/uploads/1788615421150-775873709.webp",
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
              <p className={styles.eyebrow}>
                看懂款式 · 编排制版 · 几何校验 · 工程交付
              </p>
              <h1>
                服装制版的 AI 工程系统。
                <br />
                <span>让复杂设计，成为整套纸样。</span>
              </h1>
            </div>
            <div className={styles.intro}>
              <p>
                从多模态款式理解，到组合式结构操作、确定性 CAD
                与样衣技术包。SEAM
                把设计师的表达，转化为可计算、可校验、可持续改版的服装工程。
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
                "https://blog-1304232496.cos.ap-shanghai.myqcloud.com/uploads/1788615421150-775873709.webp"
              }
              alt="SEAM 高保真工作台：裹式上衣设计参考、真实裁片几何、结构参数和校验结果"
              unoptimized
              width={2400}
              height={1500}
              priority
              sizes="(max-width: 760px) 100vw, 1280px"
            />
            <figcaption>
              <span>01 / THE CONNECTED WORKSPACE</span>
              <span>工作台界面演示 · 真实案例数据</span>
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
        <FourViewStory />
        <CaseBreakdown />
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
            <p>
              一件裹式上衣，连接款式意图、结构参数、14
              个裁片与装配关系。裁片、参数与 BOM 参考用量取自同一项目会话。
            </p>
          </div>
          <ProductWorkbench />
        </section>
        <CapabilityGrid />
        <section className={styles.dialogueSection} id="iteration">
          <div>
            <p className={styles.eyebrow}>03 / DESIGN THROUGH DIALOGUE</p>
            <h2>
              “克夫加高 1cm。”
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
              WRAP BLOUSE <span>改版示例 / V02</span>
            </header>
            <div className={styles.userMessage}>
              保持泡袖和交叠结构，克夫加高 1cm。
            </div>
            <div className={styles.agentMessage}>
              <b>SEAM</b>
              <p>
                本次调整克夫高度，保留袖口围度与交叠结构。纸样重新计算后，检查袖口装配关系并更新版本。
              </p>
            </div>
            <div className={styles.delta}>
              <span>克夫高度</span>
              <span>
                60 mm <i>→</i> <b>70 mm</b>
              </span>
              <em>+10 mm</em>
            </div>
            <div className={styles.delta}>
              <span>挂面宽度</span>
              <span>
                65 mm <i>→</i> <b>65 mm</b>
              </span>
              <small>保持</small>
            </div>
            <footer>参数变化 → 纸样重算 → 几何检查 → 版本留存</footer>
          </div>
        </section>
        <DesignRange />
        <section className={styles.section} id="delivery">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>04 / MADE FOR THE NEXT HANDOFF</p>
            <h2>交付到 CAD，也交付到样衣室。</h2>
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
              <h3>Wrap Blouse</h3>
              <p>裹式上衣 · 样衣技术包</p>
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
                  DXF 按 AAMA 数字图层组织裁线、刀口、纱向、钻孔和缝线，保留裁片
                  BLOCK 与工艺语义；SVG、PDF 和结构化清单共同服务于后续交接。
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
            从一张款式图，
            <br />
            走向一整套服装工程。
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
