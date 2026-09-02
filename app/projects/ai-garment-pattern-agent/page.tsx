import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import styles from "./pattern-agent.module.css";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";

const SITE_NAME = "五月的火";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const BASE_PATH = "/projects/ai-garment-pattern-agent";
const PAGE_IMAGE = `${BASE_PATH}/pattern-complete.webp`;
const PAGE_TITLE = "SEAM · AI 服装打版 Agent - 五月的火";
const PAGE_DESCRIPTION =
  "从图片、自然语言和尺寸表生成 StyleGraph，由 Pattern Planner 组合制版能力，再交给确定性 CAD 内核完成纸样、校验与 SVG、PDF、DXF 导出。";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${BASE_PATH}` },
  openGraph: {
    type: "article",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}${BASE_PATH}`,
    siteName: SITE_NAME,
    locale: "zh_CN",
    images: [
      {
        url: PAGE_IMAGE,
        width: 1800,
        height: 773,
        alt: "SEAM 自动生成的男衬衫完整纸样",
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

const stages = [
  ["01", "收集输入", "自然语言、参考图与毫米尺寸进入同一会话。"],
  ["02", "分析款式", "Design Agent 提取部件、层次、对称性与关系。"],
  ["03", "人工确认", "基础尺码、缺失字段和冲突必须先被确认。"],
  ["04", "规划纸样", "Pattern Planner 选择原型并组合白名单操作。"],
  ["05", "确定性制版", "CAD 内核计算曲线、坐标、缝份与派生裁片。"],
  ["06", "自动校验", "检查拓扑、自交、缝长和工艺线完整性。"],
  ["07", "多格式导出", "生成 SVG、PDF、DXF、测量表与审计清单。"],
  ["08", "人工签核", "最终纸样仍需打版师、样衣和目标 CAD 往返验证。"],
] as const;

const valueCards = [
  [
    "款式语义",
    "不是让模型猜坐标，而是先把领型、袖型、门襟、面里层和装配关系写成可验证的 StyleGraph。",
  ],
  [
    "组合式制版",
    "Planner 从基础原型出发，只能调用注册过的几何能力；遇到缺失操作时明确阻断。",
  ],
  [
    "确定性几何",
    "曲线求交、偏移、长度和拓扑由 CAD 内核计算，同一规格可以完整重放。",
  ],
  [
    "审计与边界",
    "每次出版保留规格、计划、测量、校验与文件哈希，Experimental 结果不会被伪装成生产纸样。",
  ],
] as const;

const architecture = [
  ["Design Agent", "StyleGraph + GarmentSpec"],
  ["Pattern Planner", "PatternPlan + 白名单工具"],
  ["CAD Kernel", "PatternGraph + Assembly"],
  ["Validators", "几何 / 缝长 / 工艺线"],
] as const;

const categories = [
  ["T 恤", "端到端已验证"],
  ["衬衫", "CAD 链路已接通"],
  ["卫衣", "CAD 链路已接通"],
  ["半裙", "基础原型已接入"],
  ["直筒裤", "基础原型已接入"],
  ["休闲裤", "Paco 链路已验证"],
  ["POLO", "组合内核已验证"],
  ["连衣裙", "基础链路已验证"],
] as const;

export default function GarmentPatternAgentPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero} id="hero">
          <div className={styles.heroGrid} aria-hidden="true" />
          <div className={styles.heroTopline}>
            <div>
              <Link href="/">首页</Link>
              <i>/</i>
              <Link href="/projects">项目</Link>
              <i>/</i>
              <span>SEAM</span>
            </div>
            <span>EXPERIMENTAL · 2026</span>
          </div>
          <div className={styles.heroCopy}>
            <p>AI GARMENT PATTERN AGENT · CAD SYSTEM</p>
            <h1>
              <span>SEAM</span>
              <br />
              让款式语言，
              <br />
              成为可验证的纸样。
            </h1>
            <div className={styles.heroLead}>
              从图片、自然语言与尺寸表理解服装结构；用 Agent
              规划制版，再由确定性 CAD 内核完成几何计算、校验和交付。
            </div>
          </div>
          <figure className={styles.heroPattern}>
            <Image
              src={`${BASE_PATH}/pattern-complete.webp`}
              alt="从手工推演到完整男衬衫纸样的制版结果"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 62vw"
            />
            <figcaption>
              <span>FIG. 00</span>
              <b>MEN&apos;S SHIRT · COMPLETE PATTERN</b>
            </figcaption>
          </figure>
          <dl className={styles.heroMeta}>
            <div>
              <dt>INPUT</dt>
              <dd>图像 / 文本 / 尺寸</dd>
            </div>
            <div>
              <dt>CORE</dt>
              <dd>Agent + CAD Kernel</dd>
            </div>
            <div>
              <dt>OUTPUT</dt>
              <dd>SVG / PDF / DXF</dd>
            </div>
            <div>
              <dt>STATUS</dt>
              <dd>Experimental</dd>
            </div>
          </dl>
        </section>

        <section className={styles.problemSection} id="overview">
          <div className={styles.sectionMark}>01 / THE PROBLEM</div>
          <div className={styles.problemLead}>
            <h2>
              识别一件衣服，
              <br />
              不等于能把它做出来。
            </h2>
            <div>
              <p>
                多模态模型擅长描述“这是一件衬衫”，却不应该直接生成袖窿曲线、领座长度或
                DXF
                坐标。真正的制版需要款式语义、人体尺寸、工艺规则与可计算几何在同一条链路里彼此约束。
              </p>
              <strong>
                SEAM 把模型的判断与 CAD
                的计算分开：模型负责理解和规划，内核负责确定性执行。
              </strong>
            </div>
          </div>
          <div className={styles.valueGrid}>
            {valueCards.map(([title, copy], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.pipelineSection} id="pipeline">
          <div className={styles.sectionHeading}>
            <div>
              <span>02</span>
              <p>CONTROLLED PIPELINE</p>
            </div>
            <h2>八个阶段，把一次对话变成可审计的制版任务。</h2>
            <p>
              每一阶段都有明确输入、结构化产物和停止条件。系统可以反复重算，但不能跳过确认、校验或人工签核。
            </p>
          </div>
          <ol className={styles.pipeline}>
            {stages.map(([index, title, copy]) => (
              <li key={index}>
                <span>{index}</span>
                <b>{title}</b>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.intentSection} id="stylegraph">
          <div className={styles.intentArt}>
            <Image
              src={`${BASE_PATH}/garment-concept.webp`}
              alt="用于款式分析的裹襟衬衫概念图"
              fill
              sizes="(max-width: 900px) 100vw, 42vw"
            />
            <span>REFERENCE / STYLE INTENT</span>
          </div>
          <div className={styles.intentCopy}>
            <span>03 · FROM IMAGE TO STYLEGRAPH</span>
            <h2>先把“看起来像什么”，变成“由什么组成”。</h2>
            <p>
              Design Agent
              不输出几何，而是建立服装结构的权威描述：部件、左右侧、面里层、对称性、设计特征，以及
              sewn_to、overlaps、layer_of、closes_with 等关系。
            </p>
            <div
              className={styles.schemaSample}
              aria-label="StyleGraph 示例字段"
            >
              <code>component: wrap_front</code>
              <code>neckline: shawl_collar</code>
              <code>sleeve: gathered_long</code>
              <code>closure: side_ring_tie</code>
              <code>symmetry: asymmetric</code>
            </div>
            <blockquote>
              LLM 可以提出制版策略，但不能替代曲线求交、长度、偏移和拓扑校验。
            </blockquote>
          </div>
        </section>

        <section className={styles.draftingSection} id="drafting">
          <div className={styles.sectionHeading}>
            <div>
              <span>04</span>
              <p>DRAFTING EVIDENCE</p>
            </div>
            <h2>
              纸样不是一张结果图，
              <br />
              而是一串可复查的几何决策。
            </h2>
            <p>
              从后中长、胸腰比例、肩斜和领口开始，逐步建立前后衣身、袖窿、领座、门襟与结构辅片。每一步都保留尺寸依据与中间状态。
            </p>
          </div>
          <figure className={styles.draftingFigure}>
            <Image
              src={`${BASE_PATH}/draft-stages.webp`}
              alt="衬衫前后衣身、袖窿和省道的连续制版推演"
              fill
              sizes="100vw"
            />
            <figcaption>
              <span>FIG. 04-A</span>
              <b>FRONT &amp; BACK BODICE · DRAFT EVOLUTION</b>
              <i>毫米制图 · 中间步骤保留</i>
            </figcaption>
          </figure>
          <div className={styles.draftingNotes}>
            <article>
              <b>尺寸有来源</b>
              <p>
                用户输入、版本化基础码表与人工覆盖分开记录，模型不凭空推算人体数值。
              </p>
            </article>
            <article>
              <b>操作可组合</b>
              <p>
                胸省、门襟、领座、口袋和里布等能力按依赖顺序应用，而不是切换到一台黑盒成衣引擎。
              </p>
            </article>
            <article>
              <b>调整即重出版</b>
              <p>
                “袖子加长 3cm”先变成
                SpecDelta，再从新规格全量重算纸样，避免局部几何漂移。
              </p>
            </article>
          </div>
        </section>

        <section className={styles.kernelSection} id="kernel">
          <div className={styles.kernelCopy}>
            <span>05 · DETERMINISTIC CORE</span>
            <h2>
              Agent 负责选择路径，
              <br />
              CAD 内核负责把路径算对。
            </h2>
            <p>
              Planner 只能组合能力目录中的白名单操作。最终 PatternGraph
              保存语义边、缝合关系、约束与历史；坐标、曲线偏移、缝份和裁片派生都由可测试的确定性函数完成。
            </p>
            <div className={styles.architecture}>
              {architecture.map(([name, output], index) => (
                <div key={name}>
                  <span>0{index + 1}</span>
                  <b>{name}</b>
                  <small>{output}</small>
                  {index < architecture.length - 1 && <i>↓</i>}
                </div>
              ))}
            </div>
          </div>
          <figure className={styles.kernelArt}>
            <Image
              src={`${BASE_PATH}/pattern-complete.webp`}
              alt="完整男衬衫纸样，包含前后片、袖片、领座、门襟和口袋"
              fill
              sizes="(max-width: 1000px) 100vw, 58vw"
            />
            <figcaption>PatternGraph → Assembly → CAD Layers</figcaption>
          </figure>
        </section>

        <section className={styles.reviewSection} id="validation">
          <div className={styles.reviewArt}>
            <Image
              src={`${BASE_PATH}/review-notes.webp`}
              alt="打版审核对领座、工艺线、袖克夫和内部线提出的具体修改意见"
              fill
              sizes="(max-width: 960px) 100vw, 58vw"
            />
          </div>
          <div className={styles.reviewCopy}>
            <span>06 · VALIDATION &amp; HUMAN REVIEW</span>
            <h2>
              自动校验挡住几何错误，
              <br />
              人工审核决定能不能做。
            </h2>
            <p>
              系统检查拓扑、自交、缝长匹配、折边线、刀口、钻孔和工艺线完整性；打版师继续审核领座高度、净版与缝份、工艺线位置以及目标
              CAD 的导入表现。
            </p>
            <ul>
              <li>
                <b>Geometry</b>
                <span>闭合轮廓、方向、自交、曲线容差</span>
              </li>
              <li>
                <b>Assembly</b>
                <span>缝合边配对、缝长差、对位刀口</span>
              </li>
              <li>
                <b>Process</b>
                <span>缝份、折线、纱向、扣位与内部工艺线</span>
              </li>
              <li>
                <b>Human Gate</b>
                <span>黄金纸样、样衣、面料与工厂 CAD 往返</span>
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.deliverySection} id="delivery">
          <div className={styles.sectionHeading}>
            <div>
              <span>07</span>
              <p>DELIVERABLES</p>
            </div>
            <h2>
              交付的不只是一份 DXF，
              <br />
              而是一套能够重放的出版记录。
            </h2>
            <p>
              每次生成同时留下结构语义、规划、测量、校验与文件哈希，使结果能够定位来源、比较版本并接受后续审核。
            </p>
          </div>
          <div className={styles.deliveryGrid}>
            <figure>
              <Image
                src={`${BASE_PATH}/pattern-preview.webp`}
                alt="自动导出的衬衫纸样预览，带有 Experimental 标记"
                fill
                sizes="(max-width: 900px) 100vw, 58vw"
              />
              <figcaption>EXPERIMENTAL PATTERN PREVIEW</figcaption>
            </figure>
            <div className={styles.fileList}>
              <div>
                <span>01</span>
                <b>style-graph.json</b>
                <small>款式组件、层次与结构关系</small>
              </div>
              <div>
                <span>02</span>
                <b>pattern-plan.json</b>
                <small>基础原型与组合操作计划</small>
              </div>
              <div>
                <span>03</span>
                <b>pattern.graph.json</b>
                <small>可重放的语义几何纸样</small>
              </div>
              <div>
                <span>04</span>
                <b>pattern.svg / .pdf / .dxf</b>
                <small>预览、打印与 CAD 交换文件</small>
              </div>
              <div>
                <span>05</span>
                <b>measurements.json</b>
                <small>关键成衣尺寸与缝长结果</small>
              </div>
              <div>
                <span>06</span>
                <b>manifest.json</b>
                <small>校验状态与 SHA-256 文件清单</small>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.scopeSection} id="scope">
          <div className={styles.scopeIntro}>
            <span>08 · CURRENT SCOPE</span>
            <h2>
              已经接通产品链路，
              <br />
              仍然诚实标注成熟度。
            </h2>
            <p>
              “链路已接通”不等于工业准确。所有品类升级为 Sample-ready
              之前，都需要黄金纸样、目标 CAD 往返、打版师批准与实物样衣验证。
            </p>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map(([name, status], index) => (
              <div key={name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{name}</b>
                <small>{status}</small>
              </div>
            ))}
          </div>
          <div className={styles.releaseFacts}>
            <article>
              <strong>8</strong>
              <span>基础品类接入</span>
            </article>
            <article>
              <strong>8</strong>
              <span>阶段会话状态机</span>
            </article>
            <article>
              <strong>3</strong>
              <span>核心 CAD 导出格式</span>
            </article>
            <article>
              <strong>1</strong>
              <span>不可跳过的人工签核门</span>
            </article>
          </div>
        </section>

        <section className={styles.closingSection}>
          <span>SEAM · AI GARMENT PATTERN AGENT</span>
          <p>
            从一句款式描述，
            <br />
            到一套有依据的纸样。
          </p>
          <h2>
            让 AI 参与制版，不是让它画得像，
            <br />
            而是让每一步都能被计算、复查与否决。
          </h2>
          <div>
            <b>EXPERIMENTAL</b>
            <i>NOT FOR PRODUCTION WITHOUT HUMAN REVIEW</i>
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
