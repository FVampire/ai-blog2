import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

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
import styles from "./pattern-agent.module.css";
import StageNav from "./StageNav";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";

const SITE_NAME = "五月的火";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const BASE_PATH = "/projects/ai-garment-pattern-agent";
const PAGE_IMAGE = `${BASE_PATH}/real-workbench-pattern.webp`;
const PAGE_TITLE = "SEAM · AI 服装打版 Agent - 五月的火";
const PAGE_DESCRIPTION =
  "从自然语言和参考图，到可校验纸样、3D 结构预览、工艺包与 SVG、PDF、DXF 导出的 AI 服装打版工作台。";

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
        width: 1600,
        height: 1000,
        alt: "SEAM 真实运行的 2D 衬衫纸样工作台",
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

const sections = [
  { id: "opening", index: "01", title: "一句话到纸样" },
  { id: "difficulty", index: "02", title: "难在哪" },
  { id: "mechanism", index: "03", title: "机制" },
  { id: "evidence", index: "04", title: "证据" },
  { id: "limits", index: "05", title: "边界与路线" },
] as const;

const difficulties = [
  {
    no: "01",
    title: "画得像 ≠ 缝得上",
    copy: "模型能画出像纸样的图，却不能保证闭合、配对和可缝合。本次真实会话展开为 13 个裁片，关键缝合边必须严格配伍；厘米级偏差到了样衣室，就是一块废布。",
    answer: "几何交给确定性内核，模型只到结构为止。",
  },
  {
    no: "02",
    title: "结构是依赖图，不是参数表",
    copy: "落肩增加 2.5cm，会连带袖窿深、袖山高、袖肥和袖长基准全部重算。每个参数都在一张关系网里。",
    answer: "系统保存 pattern.graph.json，而不是一组互不相干的数字。",
  },
  {
    no: "03",
    title: "自然语言天然欠定",
    copy: "“略宽松的通勤衬衫”缺少松量、门襟宽、领座高、下摆弧度等十几个可裁参数。补全策略决定系统是在协助，还是在胡编。",
    answer: "缺项必须人工确认，规格锁定后才进入制版。",
  },
  {
    no: "04",
    title: "可裁 ≠ 可交",
    copy: "纱向、刀口、钻孔、缝份和片名，缺一样，文件到了工厂都可能失效。这部分没有智能捷径，只有完整或不完整。",
    answer: "校验单独检查生产注释完整性，ERROR 会阻断导出。",
  },
] as const;

const mechanismBlocks = [
  {
    no: "01—02",
    title: "输入与结构",
    lead: "把口述、参考图和基码写成一份可确认的 GarmentSpec。模型负责理解，人工负责补齐和锁定。",
    input: "描述 / 参考图 / 165/84A",
    output: "garment-spec.json",
  },
  {
    no: "03—04",
    title: "生成与校验",
    lead: "确定性 CAD 内核按依赖图生成纸片，再检查配对长度、几何合法性和生产注释。",
    input: "GarmentSpec",
    output: "pattern.graph.json / validation.json",
  },
  {
    no: "05—06",
    title: "工艺包",
    lead: "纸样之外，样衣室还需要工艺卡、BOM、参考用量、成衣尺寸和版本记录。",
    input: "校验通过的 PatternGraph",
    output: "head-sample-pack",
  },
  {
    no: "07—08",
    title: "导出与回流",
    lead: "按 1:1、毫米单位导出 DXF-AAMA；样衣反馈结构化回传，再重跑纸样与技术包。",
    input: "DXF + 样衣反馈",
    output: "1:1 plot / V2 spec",
  },
] as const;

const boundaryCases = [
  {
    title: "未注册结构",
    at: "Pattern Planner 停止",
    message: "UNSUPPORTED_PATTERN_OPERATION",
    copy: "基础品类链路已经扩展，但遇到没有确定性几何实现的结构组合，仍会显式停止。",
  },
  {
    title: "生产状态",
    at: "提升生产状态前停止",
    message: "EXPERIMENTAL_PATTERN",
    copy: "自动校验通过不等于工业准确；黄金纸样、CAD 往返、版师签核与实物样衣缺一不可。",
  },
  {
    title: "多码推档",
    at: "导出前停止",
    message: "GRADING_RULES_REQUIRED",
    copy: "现阶段只验证单基码；没有推档规则时，不自动外推 S / M / L。",
  },
] as const;

const routes = [
  ["NOW", "八类基础版链路", "T 恤、衬衫、卫衣、裙、裤与 POLO"],
  ["NEXT", "黄金纸样与样衣", "逐品类完成版师校准和 CAD 往返"],
  ["THEN", "推档 XS—XL", "建立关键点、围度与长度档差规则"],
  ["LATER", "面料库与排料", "把缩水、门幅和真实唛架接入用量计算"],
] as const;

const evidenceAssets = {
  pattern: `${BASE_PATH}/real-workbench-pattern.webp`,
  techPack: `${BASE_PATH}/real-tech-pack.webp`,
} as const;

// TODO(evidence): add verified downloadUrl, repositoryUrl and contactUrl before exposing those actions.

function SectionHead({
  index,
  eyebrow,
  title,
  copy,
  inverse = false,
}: {
  index: string;
  eyebrow: string;
  title: string;
  copy: string;
  inverse?: boolean;
}) {
  return (
    <header className={styles.sectionHead} data-inverse={inverse || undefined}>
      <span>{index}</span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p>{copy}</p>
    </header>
  );
}

function IoBand({ input, output }: { input: string; output: string }) {
  return (
    <div className={styles.ioBand}>
      <div>
        <span>输入</span>
        <b>{input}</b>
      </div>
      <i>→</i>
      <div>
        <span>产出</span>
        <b>{output}</b>
      </div>
    </div>
  );
}

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
            <div className={styles.heroTitle}>
              <p>AI GARMENT PATTERN AGENT</p>
              <h1>SEAM</h1>
            </div>
            <div className={styles.heroStatement}>
              <p>一句话，生成一套能被检查、能进样衣室的头版纸样。</p>
              <span>
                模型负责理解服装结构，确定性 CAD
                内核负责曲线和配对；任何欠定信息、超范围结构和工业错误都会在导出前被显式拦截。
              </span>
            </div>
          </div>
          <dl className={styles.heroMeta}>
            <div>
              <dt>SCOPE</dt>
              <dd>8 类基础版 / XS—XL</dd>
            </div>
            <div>
              <dt>CORE</dt>
              <dd>Spec + CAD Kernel</dd>
            </div>
            <div>
              <dt>OUTPUT</dt>
              <dd>SVG / PDF / DXF / Tech Pack</dd>
            </div>
            <div>
              <dt>STATUS</dt>
              <dd>First Sample</dd>
            </div>
          </dl>
        </section>

        <div className={styles.workspace}>
          <StageNav stages={sections} />
          <div className={styles.story}>
            <section
              className={`${styles.section} ${styles.opening}`}
              id="opening"
            >
              <SectionHead
                index="01"
                eyebrow="FROM LANGUAGE TO GEOMETRY"
                title="一句话 → 一套纸样"
                copy="一段自然语言定义款式、基码与工艺约束；系统将它展开为带缝份、纱向、刀口和钻孔的可裁纸片。"
              />
              <div className={styles.contrastGrid}>
                <figure className={styles.promptPanel}>
                  <figcaption>
                    <span>INPUT</span>
                    <b>DESIGN_PROMPT</b>
                  </figcaption>
                  <blockquote>“{DESIGN_PROMPT}”</blockquote>
                  <small>Natural language brief · 01</small>
                </figure>
                <figure className={styles.patternHero}>
                  <Image
                    src={`${BASE_PATH}/pattern-complete.webp`}
                    alt="由款式描述生成的完整女衬衫纸样"
                    fill
                    priority
                    sizes="(max-width: 880px) 100vw, 60vw"
                  />
                  <figcaption>
                    <span>OUTPUT</span>
                    <b>COMPLETE PATTERN</b>
                  </figcaption>
                </figure>
              </div>
              <dl className={styles.numberBand}>
                <div>
                  <dt>01</dt>
                  <dd>段自然语言输入</dd>
                </div>
                <div>
                  <dt>13</dt>
                  <dd>个真实会话裁片</dd>
                </div>
                <div>
                  <dt>12</dt>
                  <dd>道样衣工序</dd>
                </div>
                <div>
                  <dt>05</dt>
                  <dd>个交付文件</dd>
                </div>
              </dl>
            </section>

            <section
              className={`${styles.section} ${styles.difficulty}`}
              id="difficulty"
            >
              <SectionHead
                index="02"
                eyebrow="THE HARD PART"
                title="难的不是把图画出来"
                copy="真正的工作是把服装语言变成一组相互依赖、可缝合、可被工厂消费的确定数据。"
              />
              <div className={styles.difficultyGrid}>
                {difficulties.map((item) => (
                  <article key={item.no}>
                    <span>{item.no}</span>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                    <strong>→ {item.answer}</strong>
                  </article>
                ))}
              </div>
            </section>

            <section
              className={`${styles.section} ${styles.mechanism}`}
              id="mechanism"
            >
              <SectionHead
                index="03"
                eyebrow="HOW IT WORKS"
                title="从结构确认，到样衣回流"
                copy="结构先被确认，几何再由确定性内核生成；工业校验、工艺包和版本回流共同守住交付边界。"
              />

              <article className={styles.mechanismBlock}>
                <header>
                  <span>{mechanismBlocks[0].no}</span>
                  <div>
                    <p>SPECIFICATION</p>
                    <h3>{mechanismBlocks[0].title}</h3>
                  </div>
                  <p>{mechanismBlocks[0].lead}</p>
                </header>
                <IoBand
                  input={mechanismBlocks[0].input}
                  output={mechanismBlocks[0].output}
                />
                <div className={styles.structureGrid}>
                  {STRUCTURE.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <b>{value}</b>
                    </div>
                  ))}
                </div>
                <p className={styles.mechanismNote}>
                  缺失字段进入人工确认；规格未锁定时，系统不会开始自动制版。
                </p>
              </article>

              <article className={styles.mechanismBlock}>
                <header>
                  <span>{mechanismBlocks[1].no}</span>
                  <div>
                    <p>DETERMINISTIC CORE</p>
                    <h3>{mechanismBlocks[1].title}</h3>
                  </div>
                  <p>{mechanismBlocks[1].lead}</p>
                </header>
                <IoBand
                  input={mechanismBlocks[1].input}
                  output={mechanismBlocks[1].output}
                />
                <div className={styles.dualTables}>
                  <div className={styles.tableWrap}>
                    <h4>纸片清单</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>纸片</th>
                          <th>数量</th>
                          <th>生产信息</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PATTERN_PIECES.map(([name, qty, detail]) => (
                          <tr key={name}>
                            <td>{name}</td>
                            <td>{qty}</td>
                            <td>{detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.validationList}>
                    <h4>工业校验</h4>
                    {VALIDATION.map(([title, detail, warn]) => (
                      <div key={title} data-warn={warn || undefined}>
                        <span>{warn ? "WARN" : "PASS"}</span>
                        <b>{title}</b>
                        <small>{detail}</small>
                      </div>
                    ))}
                  </div>
                </div>
                <p className={styles.mechanismNote}>
                  本次真实会话检查 13 个裁片与 76 个工艺标记。默认缝份 10
                  mm，领部 8 mm，下摆 30 mm。
                </p>
              </article>

              <article className={styles.mechanismBlock}>
                <header>
                  <span>{mechanismBlocks[2].no}</span>
                  <div>
                    <p>TECH PACK</p>
                    <h3>{mechanismBlocks[2].title}</h3>
                  </div>
                  <p>{mechanismBlocks[2].lead}</p>
                </header>
                <IoBand
                  input={mechanismBlocks[2].input}
                  output={mechanismBlocks[2].output}
                />
                <details className={styles.detailPanel}>
                  <summary>
                    <span>工艺操作卡 · 12 道</span>
                    <small>查看完整工序与质量控制</small>
                  </summary>
                  <div className={styles.tableWrap}>
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
                </details>
                <div className={styles.dualTables}>
                  <details className={styles.detailPanel}>
                    <summary>
                      <span>BOM · 头版参考用量</span>
                      <small>查看面辅料、规格与用量</small>
                    </summary>
                    <div className={styles.tableWrap}>
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
                              {row.map((cell, index) => (
                                <td key={`${cell}-${index}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                  <details className={styles.detailPanel}>
                    <summary>
                      <span>成衣尺寸表 · 10 项</span>
                      <small>查看目标值、公差与测量方法</small>
                    </summary>
                    <div className={styles.tableWrap}>
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
                              {row.map((cell, index) => (
                                <td key={`${cell}-${index}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              </article>

              <article className={styles.mechanismBlock}>
                <header>
                  <span>{mechanismBlocks[3].no}</span>
                  <div>
                    <p>EXPORT & FEEDBACK</p>
                    <h3>{mechanismBlocks[3].title}</h3>
                  </div>
                  <p>{mechanismBlocks[3].lead}</p>
                </header>
                <IoBand
                  input={mechanismBlocks[3].input}
                  output={mechanismBlocks[3].output}
                />
                <div className={styles.exportGrid}>
                  <div className={styles.fileList}>
                    {DXF_OUTPUTS.map((name, index) => (
                      <div key={name}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <b>{name}</b>
                        <small>
                          {index === 0 ? "DXF-AAMA · mm · 1:1" : "随样衣包交付"}
                        </small>
                      </div>
                    ))}
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
              </article>
            </section>

            <section
              className={`${styles.section} ${styles.evidence}`}
              id="evidence"
            >
              <SectionHead
                index="04"
                eyebrow="SHOW THE RECEIPTS"
                title={"把结果放到可\u2060验\u2060证的尺度上"}
                copy="两张截图来自同一份女士衬衫会话：先生成并校验纸样，再在原会话内展开工艺单、BOM 与样衣复核。"
              />
              <figure className={styles.sampleFigure}>
                <Image
                  src={evidenceAssets.pattern}
                  alt="SEAM 真实运行的女士衬衫 2D 纸样工作台，显示 13 个裁片和九阶段进度"
                  fill
                  sizes="(max-width: 880px) 100vw, 78vw"
                />
                <figcaption>
                  <span>REAL UI 01 · PATTERN</span>
                  <b>2D 纸样 · 13 裁片 · 76 工艺标记</b>
                </figcaption>
              </figure>
              <div className={styles.evidenceGrid}>
                <figure>
                  <div className={styles.evidenceImage}>
                    <Image
                      src={evidenceAssets.techPack}
                      alt="SEAM 真实工艺包界面，显示 12 道工序、BOM 与样衣验证入口"
                      fill
                      sizes="(max-width: 880px) 100vw, 50vw"
                    />
                  </div>
                  <figcaption>
                    <span>REAL UI 02 · TECH PACK</span>
                    <h3>校验完成后，继续生成工艺包</h3>
                    <p>
                      同一会话内生成 12
                      道工序、BOM、参考用量和样衣复核入口；量产用量仍明确要求实际排料复核。
                    </p>
                  </figcaption>
                </figure>
                <article className={styles.metricsCard}>
                  <span>REAL RUN · VERIFIED</span>
                  <h3>截图对应的数据清单</h3>
                  <dl>
                    <div>
                      <dt>Agent 工作流</dt>
                      <dd>9 / 9</dd>
                      <small>进入人工审核阶段</small>
                    </div>
                    <div>
                      <dt>裁片检查</dt>
                      <dd>13 / 13</dd>
                      <small>process_validated</small>
                    </div>
                    <div>
                      <dt>工艺标记</dt>
                      <dd>76</dd>
                      <small>净版 · 工艺线 · 刀口 · 布纹</small>
                    </div>
                    <div>
                      <dt>可交付文件</dt>
                      <dd>09</dd>
                      <small>SVG · PDF · DXF · JSON · HTML</small>
                    </div>
                  </dl>
                  <p>
                    文件清单写入 SHA-256；自动校验通过后仍保留 Experimental
                    水印，等待打版师与实物样衣复核。
                  </p>
                </article>
              </div>
            </section>

            <section
              className={`${styles.section} ${styles.limits}`}
              id="limits"
            >
              <div className={styles.darkPanel}>
                <SectionHead
                  index="05"
                  eyebrow="LIMITS & FAILURE"
                  title={"知道在哪里停，比假\u2060装什么都能做更重要"}
                  copy="白名单、失败信息和改版记录共同定义系统边界。超出能力范围时，它必须给出可定位的停止点。"
                  inverse
                />
                <div className={styles.boundaryGrid}>
                  {boundaryCases.map((item) => (
                    <article key={item.title}>
                      <span>{item.at}</span>
                      <h3>{item.title}</h3>
                      <code>{item.message}</code>
                      <p>{item.copy}</p>
                    </article>
                  ))}
                </div>
                <div className={styles.failureTerminal}>
                  <div>
                    <span>SEAM / RUN 0241</span>
                    <b>STOPPED</b>
                  </div>
                  <pre>{`> parse garment-spec.json\n✓ category: women_shirt\n✓ base_size: 165/84A\n✓ fabric: light_woven\n! grading: S / M / L\n\nERROR  GRADING_RULES_REQUIRED\nNo grade rule set was supplied. Export has been stopped.\nLast valid artifact: pattern.graph.json`}</pre>
                </div>
                <div className={styles.changeLog}>
                  <span>V1 → V2 · CHANGE RECORD</span>
                  <div>
                    <b>袖克夫工艺线</b>
                    <p>0.8 cm → 0.6 cm</p>
                    <small>原因：净袖口处纽扣位置偏离中心线。</small>
                  </div>
                  <div>
                    <b>下领高度</b>
                    <p>3.0 cm → 2.3 cm</p>
                    <small>原因：翻折后上领遮盖不足，领座外露。</small>
                  </div>
                  <div>
                    <b>受影响产物</b>
                    <p>4 files regenerated</p>
                    <small>pattern.graph · DXF · ops · validation</small>
                  </div>
                </div>
              </div>

              <div className={styles.roadmap}>
                <header>
                  <span>STATUS & ROUTE</span>
                  <h2>当前状态，以及接下来真正要做的事</h2>
                </header>
                <div className={styles.routeGrid}>
                  {routes.map(([tag, title, copy]) => (
                    <article key={tag}>
                      <span>{tag}</span>
                      <h3>{title}</h3>
                      <p>{copy}</p>
                    </article>
                  ))}
                </div>
                <div className={styles.notDoing}>
                  <span>明确不做</span>
                  <p>不替代大货审批</p>
                  <p>不做 3D 试衣</p>
                  <p>不做面料物理仿真</p>
                </div>
                <div className={styles.finalStatement}>
                  <p>它不是一个会画纸样图的聊天机器人。</p>
                  <h2>它是一条把自然语言约束成工业交付物的窄而深的生产链。</h2>
                </div>
              </div>
            </section>
          </div>
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
