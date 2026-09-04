import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

import StageNav from "./StageNav";
import styles from "./pattern-agent.module.css";
import {
  BOM,
  DESIGN_PROMPT,
  DXF_OUTPUTS,
  MEASUREMENTS,
  OPERATIONS,
  PACK_ITEMS,
  PATTERN_PIECES,
  STRUCTURE,
  VALIDATION,
} from "./pack-data";
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
  "从款式设计到头版样衣包：结构解析、自动纸样、工业校验、工艺/BOM、尺寸表、DXF 与 1:1 出纸。";

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
        alt: "SEAM 自动生成的衬衫纸样",
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

type StageImage = {
  src: string;
  alt: string;
  caption: string;
  placeholder?: boolean;
  cover?: boolean;
  wide?: boolean;
};

type Stage = {
  id: string;
  index: string;
  title: string;
  en: string;
  lead: string;
  detail: string;
  notes: readonly string[];
  input: string;
  output: string;
  images: readonly StageImage[];
};

const stages: readonly Stage[] = [
  {
    id: "design",
    index: "01",
    title: "款式设计",
    en: "DESIGN",
    lead: "文字、参考图和基础体型进入同一条设计意图，作为后续所有制版计算的来源。",
    detail:
      "系统按头版试样来收输入：品类与季节、廓形、领袖门襟、衣长差，以及身高胸腰臀等基码。图像只说明款式，不直接变成曲线。当前验证范围是女式基础衬衫、单基码、中薄梭织。",
    notes: [
      "支持文字、参考图或手稿，三类来源分开记账。",
      "体型、松量和面料门幅 / 缩水一起锁定，后面争议可以回到这一层。",
      "缺项进入结构确认，不会被模型自行补全成可裁纸样。",
    ],
    input: "描述 / 参考图 / 165/84A",
    output: "design brief",
    images: [
      {
        src: "stage-input-session.webp",
        alt: "设计输入：参考款、口述要点与尺寸",
        caption: "SESSION · IMAGE / TEXT / SIZE",
        placeholder: true,
      },
      {
        src: "garment-concept.webp",
        alt: "衬衫参考款",
        caption: "REFERENCE · STYLE INTENT",
        cover: true,
      },
    ],
  },
  {
    id: "structure",
    index: "02",
    title: "AI 结构解析",
    en: "SPEC",
    lead: "先写成可确认的服装结构，而不是一句“这是一件衬衫”。",
    detail:
      "解析结果是 GarmentSpec：品类、廓形、肩型、领座、袖型、门襟粒数、口袋和下摆。人工确认缺失和冲突之后，规格锁定，才能进入纸样计算。",
    notes: [
      "落肩、衬衫领+领座、七粒扣、左胸贴袋、后摆加长等特征都是显式字段。",
      "几何坐标不在这一步出现，模型到结构为止。",
      "未锁定时不会开始自动制版。",
    ],
    input: "设计意图",
    output: "garment-spec.json",
    images: [
      {
        src: "stage-stylegraph.webp",
        alt: "款式结构关系图",
        caption: "GARMENT SPEC · STRUCTURE",
        placeholder: true,
      },
      {
        src: "stage-confirm.webp",
        alt: "结构字段确认",
        caption: "CONFIRM · SPEC LOCK",
        placeholder: true,
      },
    ],
  },
  {
    id: "pattern",
    index: "03",
    title: "自动纸样",
    en: "PATTERN",
    lead: "按锁定规格参数化生成 2D 纸样，并给出可裁的纸片清单。",
    detail:
      "衣身、袖、领面、领座、袖克夫和袋片由确定性几何算出。同一规格应得到同一套坐标。纸样带着缝份、纱向、刀口和钻孔，而不是一张效果图。",
    notes: [
      "默认缝份 10mm，下摆和领部按工艺另计。",
      "操作按依赖组合：衣身 → 门襟 → 领 → 袖 → 袋。",
      "未知结构会明确停止，不改走黑盒成衣引擎。",
    ],
    input: "GarmentSpec",
    output: "pattern.graph.json",
    images: [
      {
        src: "pattern-complete.webp",
        alt: "自动生成的完整纸样",
        caption: "COMPLETE PATTERN",
      },
      {
        src: "draft-stages.webp",
        alt: "连续制版推演",
        caption: "DRAFT EVOLUTION",
        wide: true,
      },
    ],
  },
  {
    id: "validate",
    index: "04",
    title: "工业校验",
    en: "VALIDATE",
    lead: "自动校验挡住几何错误；头版试样仍要版师和工艺师看一眼。",
    detail:
      "检查肩缝配对、袖山与袖窿吃势、领座与领圈、纸片闭合与自交，以及纱向、刀口、钻孔和名称是否齐全。ERROR 阻断导出，WARN 进入头版提醒。",
    notes: [
      "肩缝、袖山、领座按厘米级差值给出通过或警告。",
      "生产注释不齐不能当可裁文件。",
      "通过校验不等于大货批准，状态仍是 AI 头版试样。",
    ],
    input: "PatternGraph",
    output: "validation.json",
    images: [
      {
        src: "stage-validate.webp",
        alt: "工业校验报告",
        caption: "VALIDATOR · PASS / WARN",
        placeholder: true,
      },
      {
        src: "review-notes.webp",
        alt: "纸样审核批注",
        caption: "STILL NEEDS PATTERNER REVIEW",
      },
    ],
  },
  {
    id: "bom",
    index: "05",
    title: "工艺 / BOM",
    en: "PROCESS",
    lead: "纸样之外，样衣室还要工序卡、面辅料和参考用量。",
    detail:
      "工艺卡覆盖从验片粘衬到整烫复核的头版 SOP。BOM 给出主料、粘衬、纽扣、线和样衣唛。用量按纸样面积、门幅、排料效率和样衣损耗估算，大货必须用真实唛架替换。",
    notes: [
      "工序带操作要求与质量控制，而不是一句“按常规做”。",
      "主料用量与门幅、缩水、损耗写在同一张清单上。",
      "BOM 和纸样版本绑定，纸样重算后用量一并重算。",
    ],
    input: "纸样 + 款式结构",
    output: "ops.json / bom.json",
    images: [
      {
        src: "stage-bom.webp",
        alt: "物料清单",
        caption: "BOM · SHELL / TRIM / QTY",
        placeholder: true,
      },
      {
        src: "stage-marker.webp",
        alt: "唛架与面料用量",
        caption: "MARKER · CONSUMPTION",
        placeholder: true,
      },
    ],
  },
  {
    id: "pack",
    index: "06",
    title: "尺寸 / 样衣包",
    en: "TECH PACK",
    lead: "交付物是一套头版样衣包，让样衣室尽量少沟通就能开裁。",
    detail:
      "成衣尺寸表给出目标值、公差和测量方法。样衣包把款式总览、纸样、工艺卡、BOM、用量、尺寸、校验和版本记录收成一份，而不是零散文件。",
    notes: [
      "关键围度和长度都有测量方法，样衣后逐项复核。",
      "超公差项目必须回传，进入 V2，而不是口头改一刀。",
      "完整度清单用来检查少没少东西，不是装饰。",
    ],
    input: "校验通过的出版记录",
    output: "head-sample-pack",
    images: [
      {
        src: "measurement-table.webp",
        alt: "成衣尺寸表",
        caption: "MEASUREMENT SPEC",
      },
    ],
  },
  {
    id: "dxf",
    index: "07",
    title: "DXF 导出",
    en: "EXPORT",
    lead: "给工厂 CAD 的是带裁剪线、缝线、刀口和纱向的 1:1 交换文件。",
    detail:
      "默认 DXF-AAMA，单位毫米，比例 1:1。同时留下样衣包 JSON、校验报告、尺寸表和 BOM，避免只丢过去一个几何文件。",
    notes: [
      "裁剪线、缝纫线、刀口、纱向、注释默认全部打开。",
      "文件哈希写入清单，避免被悄悄替换。",
      "头版水印在签核完成前不会去掉。",
    ],
    input: "通过校验的纸样",
    output: "DXF-AAMA / pack.json",
    images: [
      {
        src: "pattern-preview.webp",
        alt: "导出纸样预览",
        caption: "DXF / SVG / PDF PREVIEW",
      },
    ],
  },
  {
    id: "cad",
    index: "08",
    title: "CAD / 1:1 出纸",
    en: "PLOT",
    lead: "导入现有 CAD、1:1 出纸，再把样衣反馈收成 V2。最终验收在样衣室，不在导出按钮上。",
    detail:
      "目标是 Gerber、Lectra 或 CLO 能按 AAMA/ASTM 打开。出纸走服装绘图仪，带 100×100mm 校准框。胸围、袖长、后摆这类修改会结构化后重跑纸样和技术包。",
    notes: [
      "样衣师傅应能拿着纸样 + 工艺卡 + BOM + 尺寸表直接裁缝。",
      "V1 实际修改记录回传后生成 V2，而不是在纸上改完就断掉。",
      "未经过版师 / 工艺师确认，不得进入大货。",
    ],
    input: "DXF + 样衣包",
    output: "1:1 plot / V2 spec",
    images: [
      {
        src: "stage-plan.webp",
        alt: "出纸与改版计划",
        caption: "CAD IMPORT · V2 LOOP",
        placeholder: true,
      },
    ],
  },
];

const navStages = stages.map(({ id, index, title }) => ({ id, index, title }));

export default function GarmentPatternAgentPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero} id="hero">
          <div className={styles.heroTopline}>
            <div>
              <Link href="/">首页</Link>
              <i>/</i>
              <Link href="/projects">项目</Link>
              <i>/</i>
              <span>SEAM</span>
            </div>
            <span>HEAD SAMPLE PACK · 2026</span>
          </div>
          <div className={styles.heroBody}>
            <div>
              <p>AI GARMENT PATTERN AGENT</p>
              <h1>SEAM</h1>
            </div>
            <div className={styles.heroCopy}>
              <p>
                目标不是单独导出一份 DXF，而是给出头版样衣包：纸样、工艺、BOM、用量和尺寸表，让样衣室能直接开裁。
              </p>
              <p>
                当前验证范围是女式基础衬衫、单基码、中薄梭织。模型负责理解和规划，CAD 内核负责确定性计算。确认、校验和出纸后的改版都不能跳过。
              </p>
            </div>
          </div>
          <dl className={styles.heroMeta}>
            <div>
              <dt>SCOPE</dt>
              <dd>女衬衫 / 165/84A</dd>
            </div>
            <div>
              <dt>CORE</dt>
              <dd>Spec + CAD Kernel</dd>
            </div>
            <div>
              <dt>OUTPUT</dt>
              <dd>样衣包 / DXF / 1:1</dd>
            </div>
            <div>
              <dt>STATUS</dt>
              <dd>First Sample</dd>
            </div>
          </dl>
        </section>

        <div className={styles.workspace}>
          <StageNav stages={navStages} />

          <ol className={styles.stages}>
            {stages.map((stage) => {
              const gallery = stage.images.filter((image) => !image.wide);
              const wide = stage.images.filter((image) => image.wide);
              return (
                <li key={stage.id} id={stage.id} className={styles.stage}>
                  <header className={styles.stageHead}>
                    <span>
                      {stage.index} / {stage.en}
                    </span>
                    <h2>{stage.title}</h2>
                  </header>

                  <div className={styles.stageGrid}>
                    <div className={styles.stageCopy}>
                      <p className={styles.stageLead}>{stage.lead}</p>
                      <p>{stage.detail}</p>
                      {stage.id === "design" && (
                        <blockquote className={styles.quote}>
                          {DESIGN_PROMPT}
                        </blockquote>
                      )}
                      <ul>
                        {stage.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
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

                      {stage.id === "structure" && (
                        <div className={styles.kv}>
                          {STRUCTURE.map(([label, value]) => (
                            <div key={label}>
                              <span>{label}</span>
                              <b>{value}</b>
                            </div>
                          ))}
                        </div>
                      )}
                      {stage.id === "pattern" && (
                        <div className={styles.kv}>
                          {PATTERN_PIECES.map(([name, qty]) => (
                            <div key={name}>
                              <span>{name}</span>
                              <b>{qty}</b>
                            </div>
                          ))}
                        </div>
                      )}
                      {stage.id === "validate" && (
                        <div className={styles.kv}>
                          {VALIDATION.map(([title, detail, warn]) => (
                            <div key={title}>
                              <span>{warn ? "WARN" : "PASS"}</span>
                              <b>{title}</b>
                              <small>{detail}</small>
                            </div>
                          ))}
                        </div>
                      )}
                      {stage.id === "dxf" && (
                        <div className={styles.fileList}>
                          {DXF_OUTPUTS.map((name, index) => (
                            <div key={name}>
                              <span>{String(index + 1).padStart(2, "0")}</span>
                              <b>{name}</b>
                              <small>随样衣包一并交付</small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className={styles.gallery}
                      data-count={gallery.length > 1 ? "2" : "1"}
                    >
                      {gallery.map((image, index) => (
                        <figure
                          key={image.src}
                          className={styles.stageFigure}
                          data-cover={image.cover ? "true" : undefined}
                        >
                          <Image
                            src={`${BASE_PATH}/${image.src}`}
                            alt={image.alt}
                            fill
                            priority={stage.index === "01" && index === 0}
                            loading="eager"
                            sizes={
                              gallery.length > 1
                                ? "(max-width: 960px) 100vw, 32vw"
                                : "(max-width: 960px) 100vw, 52vw"
                            }
                          />
                          {image.placeholder && (
                            <em className={styles.placeholder}>
                              占位图 · 待替换
                            </em>
                          )}
                          <figcaption>
                            <span>
                              FIG. {stage.index}
                              {gallery.length > 1 ? `-${index + 1}` : ""}
                            </span>
                            <b>{image.caption}</b>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>

                  {stage.id === "bom" && (
                    <div className={styles.tables}>
                      <div className={styles.tableWrap}>
                        <h3>工艺操作卡 · 12 步</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>工序</th>
                              <th>操作</th>
                              <th>工艺要求</th>
                              <th>质量控制</th>
                            </tr>
                          </thead>
                          <tbody>
                            {OPERATIONS.map(([no, name, req, qc]) => (
                              <tr key={no}>
                                <td>{no}</td>
                                <td>{name}</td>
                                <td>{req}</td>
                                <td>{qc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className={styles.tableWrap}>
                        <h3>BOM · 头版参考用量</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>类别</th>
                              <th>物料</th>
                              <th>规格</th>
                              <th>用量</th>
                              <th>说明</th>
                            </tr>
                          </thead>
                          <tbody>
                            {BOM.map((row) => (
                              <tr key={row[1]}>
                                <td>{row[0]}</td>
                                <td>{row[1]}</td>
                                <td>{row[2]}</td>
                                <td>{row[3]}</td>
                                <td>{row[4]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {stage.id === "pack" && (
                    <div className={styles.tables}>
                      <div className={styles.tableWrap}>
                        <h3>成衣尺寸表</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>部位</th>
                              <th>目标 cm</th>
                              <th>公差</th>
                              <th>测量方法</th>
                            </tr>
                          </thead>
                          <tbody>
                            {MEASUREMENTS.map((row) => (
                              <tr key={row[0]}>
                                <td>{row[0]}</td>
                                <td>{row[1]}</td>
                                <td>{row[2]}</td>
                                <td>{row[3]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className={styles.packGrid}>
                        {PACK_ITEMS.map(([no, title, copy]) => (
                          <div key={no}>
                            <span>{no}</span>
                            <b>{title}</b>
                            <p>{copy}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {wide.map((image) => (
                    <figure
                      key={image.src}
                      className={`${styles.stageFigure} ${styles.wideFigure}`}
                    >
                      <Image
                        src={`${BASE_PATH}/${image.src}`}
                        alt={image.alt}
                        fill
                        loading="eager"
                        sizes="(max-width: 960px) 100vw, 78vw"
                      />
                      <figcaption>
                        <span>FIG. {stage.index}-W</span>
                        <b>{image.caption}</b>
                      </figcaption>
                    </figure>
                  ))}
                </li>
              );
            })}
          </ol>
        </div>

        <div className={styles.backLink}>
          <Link href="/projects">← 返回项目归档</Link>
          <span>EXPERIMENTAL · FIRST SAMPLE · NOT FOR BULK PRODUCTION</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
